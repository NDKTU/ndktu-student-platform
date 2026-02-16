import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { roleService, type Role } from '@/services/roleService';
import { Button } from '@/components/ui/Button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const roleSchema = z.object({
    name: z.string().min(1, 'Role name is required'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const RolesPage = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await roleService.getRoles(currentPage, pageSize, debouncedSearch);
            setRoles(data.roles);
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            console.error('Failed to fetch roles', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => { fetchData(); }, [currentPage, debouncedSearch]);

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roleToDelete) return;
        try {
            await roleService.deleteRole(roleToDelete.id);
            setRoles((prev) => prev.filter((item) => item.id !== roleToDelete.id));
            setIsDeleteModalOpen(false);
            setRoleToDelete(null);
        } catch (error) {
            console.error('Failed to delete role', error);
        }
    };

    const handleSuccess = (savedRole?: Role) => {
        setIsModalOpen(false);
        if (savedRole) {
            if (selectedRole) {
                setRoles((prev) => prev.map((r) => (r.id === savedRole.id ? savedRole : r)));
            } else {
                setRoles((prev) => [...prev, savedRole]);
            }
        } else {
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                    <p className="text-muted-foreground">Manage system roles</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search roles..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setSelectedRole(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Role
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader><CardTitle>All Roles</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>{role.id}</TableCell>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.created_at ? new Date(role.created_at).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedRole(role); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(role)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {roles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No roles found.</TableCell>
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
                isLoading={isLoading}
            />

            <RoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} role={selectedRole}
                onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Role"
                description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const RoleModal = ({ isOpen, onClose, role, onSuccess }: {
    isOpen: boolean; onClose: () => void; role: Role | null; onSuccess: (role?: Role) => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '' },
    });

    useEffect(() => {
        reset({ name: role?.name || '' });
    }, [role, reset]);

    const onSubmit = async (data: RoleFormValues) => {
        try {
            let result;
            if (role) {
                result = await roleService.updateRole(role.id, data);
            } else {
                result = await roleService.createRole(data);
            }
            onSuccess(result);
        } catch (error) {
            console.error('Failed to save role', error);
            alert('Failed to save role');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={role ? 'Edit Role' : 'Create Role'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Role Name" {...register('name')} error={errors.name?.message} placeholder="e.g. admin, teacher, student" />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isSubmitting}>{role ? 'Update' : 'Create'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default RolesPage;
