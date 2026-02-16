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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, Loader2, Download, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useSyncHemisUsers } from '@/hooks/useUsers';
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
    const [isHemisImportOpen, setIsHemisImportOpen] = useState(false);
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
    const syncHemisMutation = useSyncHemisUsers();

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
        const role = roles.find(r => r.id === roleId);
        return role ? role.name : `ID: ${roleId}`;
    };

    const handleHemisSuccess = () => {
        setIsHemisImportOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">Manage system users</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => setIsHemisImportOpen(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        Import from Hemis
                    </Button>
                    <Button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    {isUsersLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex justify-center p-8 text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                                {getRoleName(user.role_id)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${user.is_active
                                                ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
                                                : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
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

            <HemisImportModal
                isOpen={isHemisImportOpen}
                onClose={() => setIsHemisImportOpen(false)}
                onSuccess={handleHemisSuccess}
                syncHemisMutation={syncHemisMutation}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                description={`Are you sure you want to delete '${userToDelete?.username}'? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
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
                role_id: user.role_id ? user.role_id.toString() : '',
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
                    alert('Failed to update user');
                }
            });
        } else {
            if (!data.password) {
                alert('Password is required for new users');
                return;
            }
            createMutation.mutate({ ...payload, password: data.password! }, {
                onSuccess: (data) => onSuccess(data),
                onError: (error) => {
                    console.error('Failed to create user', error);
                    alert('Failed to create user');
                }
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Edit User' : 'Create User'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Username"
                    {...register('username')}
                    error={errors.username?.message}
                />

                <Input
                    label={user ? "Password (leave blank to keep current)" : "Password"}
                    type="password"
                    {...register('password')}
                    error={errors.password?.message}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('role_id')}
                    >
                        <option value="">Select a role</option>
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
                        Active Account
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {user ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const HemisImportModal = ({
    isOpen,
    onClose,
    onSuccess,
    syncHemisMutation,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    syncHemisMutation: ReturnType<typeof useSyncHemisUsers>;
}) => {
    // Separate form for import if needed in future, currently just a confirmation/trigger

    // Using local state to manage loading state explicitly if needed or rely on mutation status
    const isSubmitting = syncHemisMutation.isPending;

    const handleImport = () => {
        syncHemisMutation.mutate(undefined, {
            onSuccess: () => {
                onSuccess();
            },
            onError: (error: any) => {
                console.error('Failed to sync', error);
                alert('Failed to sync with Hemis');
            }
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import from Hemis"
        >
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    This will synchronize users, students, and other data from the Hemis system.
                    This process might take a few moments.
                </p>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} isLoading={isSubmitting}>
                        Start Import
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default UsersPage;
