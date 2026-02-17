import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { User, UserCreateRequest, Role } from '@/types/auth';
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
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useReferenceData';

const userSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().optional(),
    role_id: z.string().min(1, 'Role is required'),
    is_active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

const UsersPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: usersData, isLoading: isUsersLoading } = useUsers(currentPage, pageSize, debouncedSearch);
    const { data: rolesData } = useRoles();
    const deleteUserMutation = useDeleteUser();


    const users = usersData?.users || [];
    const totalPages = usersData ? Math.ceil(usersData.total / pageSize) : 1;
    const roles = rolesData?.roles || [];

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        deleteUserMutation.mutate(userToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            },
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
    };

    const getRoleName = (roleId?: number) => {
        if (!roleId) return 'N/A';
        // Explicitly typo role to avoid implicit any if the roles array type isn't fully inferred or is loose
        const role = roles.find((r: Role) => r.id === roleId);
        return role ? role.name : `ID: ${roleId}`;
    };



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   {/* Headers removed as per user request */}
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Foydalanuvchilarni qidirish..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Foydalanuvchi qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent>
                    {isUsersLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex justify-center p-8 text-muted-foreground">
                            Foydalanuvchilar topilmadi.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Foydalanuvchi nomi (Username)</TableHead>
                                    <TableHead>Rol</TableHead>

                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                                {getRoleName(user.roles?.[0]?.id)}
                                            </span>
                                        </TableCell>

                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(user)}
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
                isLoading={isUsersLoading}
            />

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                roles={roles}
                onSuccess={handleSuccess}
            />



            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Foydalanuvchini o'chirish"
                description={`Siz haqiqatan ham '${userToDelete?.username}' foydalanuvchisini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
};

const UserModal = ({
    isOpen,
    onClose,
    user,
    roles,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    roles: Role[];
    onSuccess: (user?: User) => void;
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema) as any,
        defaultValues: {
            username: '',
            password: '',
            role_id: '',
            is_active: true,
        },
    });

    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (user) {
            reset({
                username: user.username,
                password: '', // Don't fill password on edit
                role_id: user.roles?.[0]?.id ? user.roles[0].id.toString() : '',
                is_active: user.is_active,
            });
        } else {
            reset({
                username: '',
                password: '',
                role_id: '',
                is_active: true,
            });
        }
    }, [user, reset]);

    const onSubmit = (data: UserFormValues) => {
        const payload: UserCreateRequest = {
            username: data.username,
            password: data.password || undefined,
            role_id: parseInt(data.role_id, 10),
            is_active: data.is_active,
        };

        if (user) {
            updateMutation.mutate({ id: user.id, data: payload }, {
                onSuccess: (data) => onSuccess(data),
                onError: (error) => {
                    console.error('Failed to update user', error);
                    alert('Foydalanuvchini yangilashda xatolik yuz berdi');
                }
            });
        } else {
            if (!data.password) {
                alert('Yangi foydalanuvchilar uchun parol talab qilinadi');
                return;
            }
            createMutation.mutate({ ...payload, password: data.password! }, {
                onSuccess: (data) => onSuccess(data),
                onError: (error) => {
                    console.error('Failed to create user', error);
                    alert('Foydalanuvchi yaratishda xatolik yuz berdi');
                }
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Foydalanuvchini tahrirlash' : 'Foydalanuvchi yaratish'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Foydalanuvchi nomi"
                    {...register('username')}
                    error={errors.username?.message}
                />

                <Input
                    label={user ? "Parol (o'zgartirish uchun kiriting)" : "Parol"}
                    type="password"
                    {...register('password')}
                    error={errors.password?.message}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium">Rol</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('role_id')}
                    >
                        <option value="">Rolni tanlang</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                    {errors.role_id && (
                        <p className="text-xs text-destructive">{errors.role_id.message}</p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="is_active"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        {...register('is_active')}
                    />
                    <label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Faol hisob
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Bekor qilish
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {user ? 'Yangilash' : 'Yaratish'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};



export default UsersPage;
