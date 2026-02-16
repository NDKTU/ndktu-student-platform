import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { facultyService, type Faculty } from '@/services/facultyService';
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

const facultySchema = z.object({
    name: z.string().min(1, 'Faculty name is required'),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

const FacultyPage = () => {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await facultyService.getFaculties(currentPage, pageSize, debouncedSearch);
            setFaculties(data.faculties);
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            console.error('Failed to fetch faculties', error);
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

    const handleDeleteClick = (faculty: Faculty) => {
        setFacultyToDelete(faculty);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!facultyToDelete) return;
        try {
            await facultyService.deleteFaculty(facultyToDelete.id);
            setFaculties((prev) => prev.filter((item) => item.id !== facultyToDelete.id));
            setIsDeleteModalOpen(false);
            setFacultyToDelete(null);
        } catch (error) {
            console.error('Failed to delete faculty', error);
        }
    };

    const handleSuccess = (savedFaculty?: Faculty) => {
        setIsModalOpen(false);
        if (savedFaculty) {
            if (selectedFaculty) {
                setFaculties((prev) => prev.map((f) => (f.id === savedFaculty.id ? savedFaculty : f)));
            } else {
                setFaculties((prev) => [...prev, savedFaculty]);
            }
        } else {
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Faculties</h1>
                    <p className="text-muted-foreground">Manage university faculties</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search faculties..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setSelectedFaculty(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Faculty
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader><CardTitle>All Faculties</CardTitle></CardHeader>
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
                                {faculties.map((faculty) => (
                                    <TableRow key={faculty.id}>
                                        <TableCell>{faculty.id}</TableCell>
                                        <TableCell className="font-medium">{faculty.name}</TableCell>
                                        <TableCell>{new Date(faculty.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedFaculty(faculty); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(faculty)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {faculties.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No faculties found.</TableCell>
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

            <FacultyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} faculty={selectedFaculty}
                onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Faculty"
                description={`Are you sure you want to delete the faculty "${facultyToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const FacultyModal = ({ isOpen, onClose, faculty, onSuccess }: {
    isOpen: boolean; onClose: () => void; faculty: Faculty | null; onSuccess: (faculty?: Faculty) => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FacultyFormValues>({
        resolver: zodResolver(facultySchema),
        defaultValues: { name: '' },
    });

    useEffect(() => {
        reset({ name: faculty?.name || '' });
    }, [faculty, reset]);

    const onSubmit = async (data: FacultyFormValues) => {
        try {
            let result;
            if (faculty) {
                result = await facultyService.updateFaculty(faculty.id, data);
            } else {
                result = await facultyService.createFaculty(data);
            }
            onSuccess(result);
        } catch (error) {
            console.error('Failed to save faculty', error);
            alert('Failed to save faculty');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={faculty ? 'Edit Faculty' : 'Create Faculty'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Faculty Name" {...register('name')} error={errors.name?.message} placeholder="Enter faculty name" />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isSubmitting}>{faculty ? 'Update' : 'Create'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default FacultyPage;
