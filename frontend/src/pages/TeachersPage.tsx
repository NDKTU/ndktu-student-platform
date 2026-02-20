import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { Teacher } from '@/services/teacherService';
import { Button } from '@/components/ui/Button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loader2, Search, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useAssignGroups, useAssignSubjects } from '@/hooks/useTeachers';
import { useKafedras } from '@/hooks/useReferenceData';
import { useUsers } from '@/hooks/useUsers';
import { useGroups } from '@/hooks/useGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const teacherSchema = z.object({
    first_name: z.string().min(1, 'Ism kiritilishi shart'),
    last_name: z.string().min(1, 'Familiya kiritilishi shart'),
    third_name: z.string().min(1, 'Otasining ismi kiritilishi shart'),
    kafedra_id: z.number().min(1, 'Kafedra tanlanishi shart'),
    user_id: z.number().min(1, 'Foydalanuvchi tanlanishi shart'),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

const TeachersPage = () => {
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [teacherToAssign, setTeacherToAssign] = useState<Teacher | null>(null);

    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: teachersData, isLoading: isTeachersLoading } = useTeachers(currentPage, pageSize, debouncedSearch);
    const deleteTeacherMutation = useDeleteTeacher();

    const teachers = teachersData?.teachers || [];
    const totalPages = teachersData ? Math.ceil(teachersData.total / pageSize) : 1;

    const handleViewTeacher = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setViewMode('detail');
    };

    const handleBackToList = () => {
        setSelectedTeacher(null);
        setViewMode('list');
    };

    const handleEditClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setTeacherToDelete(teacher);
        setIsDeleteModalOpen(true);
    };

    const handleAssignGroupsClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setTeacherToAssign(teacher);
        setIsGroupModalOpen(true);
    };

    const handleAssignSubjectsClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setTeacherToAssign(teacher);
        setIsSubjectModalOpen(true);
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
        setSelectedTeacher(null);
    };

    if (viewMode === 'detail' && selectedTeacher) {
        return <TeacherDetail teacher={selectedTeacher} onBack={handleBackToList} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">O'qituvchilar</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="O'qituvchilarni qidirish..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setSelectedTeacher(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        O'qituvchi qo'shish
                    </Button>
                </div>
            </div>
            <Card>
                <CardContent>
                    {isTeachersLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>F.I.SH / Kafedra</TableHead>
                                    <TableHead>Foydalanuvchi</TableHead>
                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map((teacher) => (
                                    <TableRow
                                        key={teacher.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleViewTeacher(teacher)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="capitalize">{teacher.full_name || teacher.user?.username || 'Noma\'lum'}</div>
                                            {teacher.kafedra && (
                                                <div className="text-xs text-muted-foreground capitalize">
                                                    {teacher.kafedra?.name}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{teacher.user?.username || '-'}</TableCell>
                                        <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => handleAssignGroupsClick(teacher, e)}>
                                                    Guruhlar
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={(e) => handleAssignSubjectsClick(teacher, e)}>
                                                    Fanlar
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(teacher, e)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={(e) => handleDeleteClick(teacher, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {teachers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">O'qituvchilar topilmadi.</TableCell>
                                    </TableRow>
                                )}
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

            <TeacherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teacher={selectedTeacher}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="O'qituvchini o'chirish"
                description={`Siz haqiqatan ham "${teacherToDelete?.full_name}" o'qituvchisini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />

            <TeacherGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                teacher={teacherToAssign}
            />

            <TeacherSubjectModal
                isOpen={isSubjectModalOpen}
                onClose={() => setIsSubjectModalOpen(false)}
                teacher={teacherToAssign}
            />
        </div>
    );
};

const TeacherDetail = ({ teacher, onBack }: { teacher: Teacher; onBack: () => void }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Orqaga
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{teacher.full_name || `O'qituvchi #${teacher.id}`}</h1>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">F.I.SH:</span>
                            <span>{teacher.full_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Ism:</span>
                            <span>{teacher.first_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Familiya:</span>
                            <span>{teacher.last_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Otasining ismi:</span>
                            <span>{teacher.third_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Foydalanuvchi:</span>
                            <span>{teacher.user?.username || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Kafedra ma'lumotlari</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Kafedra:</span>
                            <span>{teacher.kafedra?.name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Fakultet ID:</span>
                            <span>{teacher.kafedra?.faculty_id || '-'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const TeacherModal = ({ isOpen, onClose, teacher, onSuccess }: {
    isOpen: boolean; onClose: () => void; teacher: Teacher | null; onSuccess: () => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema),
        defaultValues: { first_name: '', last_name: '', third_name: '', kafedra_id: 0, user_id: 0 },
    });

    const { data: kafedrasData } = useKafedras();
    const { data: usersData } = useUsers(1, 100);

    const createMutation = useCreateTeacher();
    const updateMutation = useUpdateTeacher();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const kafedras = kafedrasData?.kafedras || [];
    const users = usersData?.users || [];

    const selectedKafedraId = watch('kafedra_id');
    const selectedUserId = watch('user_id');

    useEffect(() => {
        if (teacher) {
            reset({
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                third_name: teacher.third_name,
                kafedra_id: teacher.kafedra_id,
                user_id: teacher.user_id,
            });
        } else {
            reset({ first_name: '', last_name: '', third_name: '', kafedra_id: 0, user_id: 0 });
        }
    }, [teacher, reset]);

    const onSubmit = (data: TeacherFormValues) => {
        if (teacher) {
            updateMutation.mutate({ id: teacher.id, data }, {
                onSuccess: () => onSuccess(),
                onError: () => alert("O'qituvchini yangilashda xatolik"),
            });
        } else {
            createMutation.mutate(data, {
                onSuccess: () => onSuccess(),
                onError: () => alert("O'qituvchi yaratishda xatolik"),
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={teacher ? "O'qituvchini tahrirlash" : "O'qituvchi yaratish"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Familiya" {...register('last_name')} error={errors.last_name?.message} placeholder="Familiyani kiriting" />
                <Input label="Ism" {...register('first_name')} error={errors.first_name?.message} placeholder="Ismni kiriting" />
                <Input label="Otasining ismi" {...register('third_name')} error={errors.third_name?.message} placeholder="Otasining ismini kiriting" />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Kafedra</label>
                    <select
                        value={selectedKafedraId}
                        onChange={(e) => setValue('kafedra_id', Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value={0}>Kafedrani tanlang...</option>
                        {kafedras.map((kafedra) => (
                            <option key={kafedra.id} value={kafedra.id}>{kafedra.name}</option>
                        ))}
                    </select>
                    {errors.kafedra_id && (
                        <p className="mt-1 text-xs text-destructive">{errors.kafedra_id.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Foydalanuvchi</label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setValue('user_id', Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value={0}>Foydalanuvchini tanlang...</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                    {errors.user_id && (
                        <p className="mt-1 text-xs text-destructive">{errors.user_id.message}</p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" isLoading={isSubmitting}>{teacher ? 'Yangilash' : 'Yaratish'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const TeacherGroupModal = ({ isOpen, onClose, teacher }: { isOpen: boolean; onClose: () => void; teacher: Teacher | null }) => {
    const { data: groupsData } = useGroups(1, 100, '');
    const assignGroupsMutation = useAssignGroups();
    const groups = groupsData?.groups || [];

    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

    useEffect(() => {
        if (teacher && isOpen) {
            setSelectedGroupIds(teacher.user?.group_teachers?.map((g: any) => g.group_id) || []);
        }
    }, [teacher, isOpen]);

    const handleToggleGroup = (id: number) => {
        setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const handleSave = () => {
        if (!teacher || !teacher.user) return;
        assignGroupsMutation.mutate({ user_id: teacher.user.id, group_ids: selectedGroupIds }, {
            onSuccess: () => onClose(),
            onError: () => alert("Guruhlarni biriktirishda xatolik yuz berdi")
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${teacher?.full_name} ga guruhlarni biriktirish`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-4 border rounded-md bg-muted/20">
                    {groups.map(group => (
                        <div key={group.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`group-${group.id}`}
                                checked={selectedGroupIds.includes(group.id)}
                                onChange={() => handleToggleGroup(group.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis">
                                {group.name}
                            </label>
                        </div>
                    ))}
                    {groups.length === 0 && <span className="text-sm text-muted-foreground">Guruhlar topilmadi.</span>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button onClick={handleSave} isLoading={assignGroupsMutation.isPending}>Saqlash</Button>
                </div>
            </div>
        </Modal>
    );
};

const TeacherSubjectModal = ({ isOpen, onClose, teacher }: { isOpen: boolean; onClose: () => void; teacher: Teacher | null }) => {
    const { data: subjectsData } = useSubjects(1, 100, '');
    const assignSubjectsMutation = useAssignSubjects();
    const subjects = subjectsData?.subjects || [];

    const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

    useEffect(() => {
        if (teacher && isOpen) {
            setSelectedSubjectIds(teacher.subject_teachers?.map(s => s.subject_id) || []);
        }
    }, [teacher, isOpen]);

    const handleToggleSubject = (id: number) => {
        setSelectedSubjectIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handleSave = () => {
        if (!teacher) return;
        assignSubjectsMutation.mutate({ teacher_id: teacher.id, subject_ids: selectedSubjectIds }, {
            onSuccess: () => onClose(),
            onError: () => alert("Fanlarni biriktirishda xatolik yuz berdi")
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${teacher?.full_name} ga fanlarni biriktirish`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-4 border rounded-md bg-muted/20">
                    {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`subject-${subject.id}`}
                                checked={selectedSubjectIds.includes(subject.id)}
                                onChange={() => handleToggleSubject(subject.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis">
                                {subject.name}
                            </label>
                        </div>
                    ))}
                    {subjects.length === 0 && <span className="text-sm text-muted-foreground">Fanlar topilmadi.</span>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button onClick={handleSave} isLoading={assignSubjectsMutation.isPending}>Saqlash</Button>
                </div>
            </div>
        </Modal>
    );
};

export default TeachersPage;
