import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { type Student, type StudentCreateRequest } from '@/services/studentService';
import { type Group } from '@/services/groupService';
import type { User } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Pencil, Trash2, Loader2, User as UserIcon, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStudents, useDeleteStudent, useCreateStudent, useUpdateStudent } from '@/hooks/useStudents';
import { useGroups } from '@/hooks/useGroups';
import { useUsers } from '@/hooks/useUsers';

const studentSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    third_name: z.string().optional(),
    group_id: z.string().min(1, 'Group is required'),
    user_id: z.string().min(1, 'User is required'),
});

type StudentFormValues = z.infer<typeof studentSchema>;

const StudentsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailStudent, setDetailStudent] = useState<Student | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: studentsData, isLoading: isStudentsLoading } = useStudents(currentPage, pageSize, debouncedSearch);
    const { data: groupsData } = useGroups(1, 100);
    const { data: usersData } = useUsers(1, 100);
    const deleteStudentMutation = useDeleteStudent();

    const students = studentsData?.students || [];
    const totalPages = studentsData ? Math.ceil(studentsData.total / pageSize) : 1;
    const groups = groupsData?.groups || [];
    const users = usersData?.users || [];

    const handleRowClick = (student: Student) => {
        setDetailStudent(student);
        setIsDetailModalOpen(true);
    };

    const handleDeleteClick = (student: Student) => {
        setStudentToDelete(student);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!studentToDelete) return;
        deleteStudentMutation.mutate(studentToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setStudentToDelete(null);
            },
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
    };

    const getGroupName = (groupId: number) => {
        return groups.find(g => g.id === groupId)?.name || 'Unknown Group';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                    <p className="text-muted-foreground">Manage student records</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Students</CardTitle>
                </CardHeader>
                <CardContent>
                    {isStudentsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <UserIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p>No students found. Import via Users page to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Group</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(student)}
                                    >
                                        <TableCell>{student.id}</TableCell>
                                        <TableCell className="font-medium">{student.full_name}</TableCell>
                                        <TableCell>{getGroupName(student.group_id)}</TableCell>
                                        <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedStudent(student); setIsModalOpen(true); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(student)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isStudentsLoading}
            />

            <StudentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                student={detailStudent}
                getGroupName={getGroupName}
                users={users}
            />

            <StudentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                student={selectedStudent}
                groups={groups}
                users={users}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Student"
                description={`Are you sure you want to delete '${studentToDelete?.full_name}'? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const StudentModal = ({
    isOpen,
    onClose,
    student,
    groups,
    users,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    groups: Group[];
    users: User[];
    onSuccess: (student?: Student) => void;
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting: isFormSubmitting },
    } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
    });

    const createMutation = useCreateStudent();
    const updateMutation = useUpdateStudent();
    const isSubmitting = isFormSubmitting || createMutation.isPending || updateMutation.isPending;

    // ... (rest of the component logic for reset effect is same, but submitting logic changes)
    useEffect(() => {
        if (student) {
            reset({
                first_name: student.first_name,
                last_name: student.last_name,
                third_name: student.third_name || '',
                group_id: student.group_id.toString(),
                user_id: student.user_id.toString(),
            });
        }
    }, [student, reset]);

    const onSubmit = (data: StudentFormValues) => {
        const payload: StudentCreateRequest = {
            first_name: data.first_name,
            last_name: data.last_name,
            third_name: data.third_name || '',
            group_id: parseInt(data.group_id, 10),
            user_id: parseInt(data.user_id, 10),
        };

        if (student) {
            updateMutation.mutate({ id: student.id, data: payload }, {
                onSuccess: () => onSuccess(),
                onError: (error) => {
                    console.error('Failed to update student', error);
                    alert('Failed to update student');
                }
            });
        } else {
            // Although creation is ostensibly disabled in UI, keeping logic here if enabled later
            // or if I missed where it was disabled. The layout says "Creation is disabled".
            // But if I were to implement it:
            /*
            createMutation.mutate(payload, {
               onSuccess: () => onSuccess(),
               onError: (error) => {
                   console.error('Failed to create student', error);
                   alert('Failed to create student');
               }
            });
            */
        }
    };

    // ... (render)
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Student"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Inputs ... */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        {...register('first_name')}
                        error={errors.first_name?.message}
                    />
                    <Input
                        label="Last Name"
                        {...register('last_name')}
                        error={errors.last_name?.message}
                    />
                </div>
                <Input
                    label="Third Name (Optional)"
                    {...register('third_name')}
                    error={errors.third_name?.message}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium">Group</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('group_id')}
                    >
                        <option value="">Select a group</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                    {errors.group_id && (
                        <p className="text-xs text-destructive">{errors.group_id.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">User Account</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('user_id')}
                    >
                        <option value="">Select a user account</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground">Select the system user account for this student.</p>
                    {errors.user_id && (
                        <p className="text-xs text-destructive">{errors.user_id.message}</p>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        Update
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const StudentDetailModal = ({
    isOpen,
    onClose,
    student,
    getGroupName,
    users,
}: {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    getGroupName: (id: number) => string;
    users: User[];
}) => {
    if (!student) return null;

    const getUserName = (userId: number) => {
        return users.find(u => u.id === userId)?.username || 'Unknown User';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Student Details"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">ID</label>
                        <p className="text-base">{student.id}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="text-base font-medium">{student.full_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">First Name</label>
                        <p className="text-base">{student.first_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                        <p className="text-base">{student.last_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Third Name</label>
                        <p className="text-base">{student.third_name || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Group</label>
                        <p className="text-base">{getGroupName(student.group_id)}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">User Account</label>
                        <p className="text-base">{getUserName(student.user_id)}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Created At</label>
                        <p className="text-base">{new Date(student.created_at).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default StudentsPage;
