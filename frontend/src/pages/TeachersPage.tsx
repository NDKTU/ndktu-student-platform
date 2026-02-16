import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { Teacher, TeacherCreateRequest } from '@/services/teacherService';
import type { User } from '@/types/auth';
import type { Kafedra } from '@/services/kafedraService';
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
import { Plus, Pencil, Trash2, Loader2, User as UserIcon, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/hooks/useTeachers';
import { useKafedras } from '@/hooks/useReferenceData';
import { useUsers } from '@/hooks/useUsers';

const teacherSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    third_name: z.string().optional(),
    kafedra_id: z.string().min(1, 'Kafedra is required'),
    user_id: z.string().optional(), // Make user_id optional since we might create a user automatically or select one
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

const TeachersPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
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

    const { data: teachersData, isLoading: isTeachersLoading } = useTeachers(currentPage, pageSize, debouncedSearch);
    const { data: kafedrasData } = useKafedras();
    const { data: usersData } = useUsers(1, 100);
    const deleteTeacherMutation = useDeleteTeacher();

    const teachers = teachersData?.teachers || [];
    const totalPages = teachersData ? Math.ceil(teachersData.total / pageSize) : 1;
    const kafedras = kafedrasData?.kafedras || [];
    const users = usersData?.users || [];

    const handleRowClick = (teacher: Teacher) => {
        setDetailTeacher(teacher);
        setIsDetailModalOpen(true);
    };

    const handleDeleteClick = (teacher: Teacher) => {
        setTeacherToDelete(teacher);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!teacherToDelete) return;
        deleteTeacherMutation.mutate(teacherToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setTeacherToDelete(null);
            },
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
    };

    const getKafedraName = (kafedraId: number) => {
        return kafedras.find(k => k.id === kafedraId)?.name || 'Unknown Kafedra';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
                    <p className="text-muted-foreground">Manage teacher records</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search teachers..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setSelectedTeacher(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Teacher
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                    {isTeachersLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : teachers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <UserIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p>No teachers found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Kafedra</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map((teacher) => (
                                    <TableRow
                                        key={teacher.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(teacher)}
                                    >
                                        <TableCell>{teacher.id}</TableCell>
                                        <TableCell className="font-medium">{teacher.full_name}</TableCell>
                                        <TableCell>{getKafedraName(teacher.kafedra_id)}</TableCell>
                                        <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedTeacher(teacher); setIsModalOpen(true); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(teacher)}
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
                isLoading={isTeachersLoading}
            />

            <TeacherDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                teacher={detailTeacher}
                getKafedraName={getKafedraName}
                users={users}
            />

            <TeacherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teacher={selectedTeacher}
                kafedras={kafedras}
                users={users}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Teacher"
                description={`Are you sure you want to delete '${teacherToDelete?.full_name}'? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const TeacherModal = ({
    isOpen,
    onClose,
    teacher,
    kafedras,
    users,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher | null;
    kafedras: Kafedra[];
    users: User[];
    onSuccess: (teacher?: Teacher) => void;
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema),
    });

    const createMutation = useCreateTeacher();
    const updateMutation = useUpdateTeacher();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (teacher) {
            reset({
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                third_name: teacher.third_name || '',
                kafedra_id: teacher.kafedra_id.toString(),
                user_id: teacher.user_id ? teacher.user_id.toString() : '',
            });
        } else {
            reset({
                first_name: '',
                last_name: '',
                third_name: '',
                kafedra_id: '',
                user_id: '',
            });
        }
    }, [teacher, reset]);

    const onSubmit = (data: TeacherFormValues) => {
        const payload: TeacherCreateRequest = {
            first_name: data.first_name,
            last_name: data.last_name,
            third_name: data.third_name || '',
            kafedra_id: parseInt(data.kafedra_id, 10),
            user_id: data.user_id ? parseInt(data.user_id, 10) : 0,
        };

        if (teacher) {
            updateMutation.mutate({ id: teacher.id, data: payload }, {
                onSuccess: (data) => onSuccess(data),
                onError: (error) => {
                    console.error('Failed to update teacher', error);
                    alert('Failed to update teacher');
                }
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: (data) => onSuccess(data),
                onError: (error) => {
                    console.error('Failed to create teacher', error);
                    alert('Failed to create teacher');
                }
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={teacher ? 'Edit Teacher' : 'Create Teacher'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <label className="text-sm font-medium">Kafedra</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('kafedra_id')}
                    >
                        <option value="">Select a kafedra</option>
                        {kafedras.map((kafedra) => (
                            <option key={kafedra.id} value={kafedra.id}>
                                {kafedra.name}
                            </option>
                        ))}
                    </select>
                    {errors.kafedra_id && (
                        <p className="text-xs text-destructive">{errors.kafedra_id.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">User Account</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('user_id')}
                    >
                        <option value="">Select a user account (Optional)</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground">Select system user account for this teacher.</p>
                    {errors.user_id && (
                        <p className="text-xs text-destructive">{errors.user_id.message}</p>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {teacher ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const TeacherDetailModal = ({
    isOpen,
    onClose,
    teacher,
    getKafedraName,
    users,
}: {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher | null;
    getKafedraName: (id: number) => string;
    users: User[];
}) => {
    if (!teacher) return null;

    const getUserName = (userId: number) => {
        return users.find(u => u.id === userId)?.username || 'No user linked';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Teacher Details"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">ID</label>
                        <p className="text-base">{teacher.id}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="text-base font-medium">{teacher.full_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">First Name</label>
                        <p className="text-base">{teacher.first_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                        <p className="text-base">{teacher.last_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Third Name</label>
                        <p className="text-base">{teacher.third_name || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Kafedra</label>
                        <p className="text-base">{getKafedraName(teacher.kafedra_id)}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">User Account</label>
                        <p className="text-base">{teacher.user_id ? getUserName(teacher.user_id) : 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Created At</label>
                        <p className="text-base">{new Date(teacher.created_at).toLocaleString()}</p>
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

export default TeachersPage;
