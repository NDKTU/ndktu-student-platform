import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { kafedraService, type Kafedra } from '@/services/kafedraService';
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

const kafedraSchema = z.object({
    name: z.string().min(1, 'Kafedra name is required'),
    faculty_id: z.number({ message: 'Faculty is required' }).min(1, 'Select a faculty'),
});

type KafedraFormValues = z.infer<typeof kafedraSchema>;

const KafedraPage = () => {
    const [kafedras, setKafedras] = useState<Kafedra[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKafedra, setSelectedKafedra] = useState<Kafedra | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [kafedraToDelete, setKafedraToDelete] = useState<Kafedra | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [kafedrasData, facultiesData] = await Promise.all([
                kafedraService.getKafedras(currentPage, pageSize, debouncedSearch),
                facultyService.getFaculties(),
            ]);
            setKafedras(kafedrasData.kafedras);
            setTotalPages(Math.ceil(kafedrasData.total / pageSize));
            setFaculties(facultiesData.faculties);
        } catch (error) {
            console.error('Failed to fetch data', error);
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

    const handleDeleteClick = (kafedra: Kafedra) => {
        setKafedraToDelete(kafedra);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!kafedraToDelete) return;

        try {
            await kafedraService.deleteKafedra(kafedraToDelete.id);
            setKafedras((prev) => prev.filter((item) => item.id !== kafedraToDelete.id)); // Optimistic update
            setIsDeleteModalOpen(false);
            setKafedraToDelete(null);
        } catch (error) {
            console.error('Failed to delete kafedra', error);
        }
    };

    const getFacultyName = (facultyId: number) => {
        const faculty = faculties.find(f => f.id === facultyId);
        return faculty ? faculty.name : `ID: ${facultyId}`;
    };

    const handleSuccess = (savedKafedra?: Kafedra) => {
        setIsModalOpen(false);
        if (savedKafedra) {
            if (selectedKafedra) {
                setKafedras((prev) => prev.map((k) => (k.id === savedKafedra.id ? savedKafedra : k)));
            } else {
                setKafedras((prev) => [...prev, savedKafedra]);
            }
        } else {
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kafedras</h1>
                    <p className="text-muted-foreground">Manage university departments (kafedras)</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search kafedras..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setSelectedKafedra(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Kafedra
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader><CardTitle>All Kafedras</CardTitle></CardHeader>
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
                                    <TableHead>Faculty</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kafedras.map((kafedra) => (
                                    <TableRow key={kafedra.id}>
                                        <TableCell>{kafedra.id}</TableCell>
                                        <TableCell className="font-medium">{kafedra.name}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                                {getFacultyName(kafedra.faculty_id)}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(kafedra.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedKafedra(kafedra); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(kafedra)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {kafedras.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No kafedras found.</TableCell>
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

            <KafedraModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} kafedra={selectedKafedra}
                faculties={faculties} onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Kafedra"
                description={`Are you sure you want to delete the kafedra "${kafedraToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const KafedraModal = ({ isOpen, onClose, kafedra, faculties, onSuccess }: {
    isOpen: boolean; onClose: () => void; kafedra: Kafedra | null; faculties: Faculty[]; onSuccess: (kafedra?: Kafedra) => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<KafedraFormValues>({
        resolver: zodResolver(kafedraSchema),
        defaultValues: { name: '', faculty_id: 0 },
    });

    const selectedFacultyId = watch('faculty_id');

    useEffect(() => {
        if (kafedra) {
            reset({ name: kafedra.name, faculty_id: kafedra.faculty_id });
        } else {
            reset({ name: '', faculty_id: 0 });
        }
    }, [kafedra, reset]);

    const onSubmit = async (data: KafedraFormValues) => {
        try {
            let result;
            if (kafedra) {
                result = await kafedraService.updateKafedra(kafedra.id, data);
            } else {
                result = await kafedraService.createKafedra(data);
            }
            onSuccess(result);
        } catch (error) {
            console.error('Failed to save kafedra', error);
            alert('Failed to save kafedra');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={kafedra ? 'Edit Kafedra' : 'Create Kafedra'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Kafedra Name" {...register('name')} error={errors.name?.message} placeholder="Enter kafedra name" />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Faculty</label>
                    <select
                        value={selectedFacultyId}
                        onChange={(e) => setValue('faculty_id', Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value={0}>Select a faculty...</option>
                        {faculties.map((faculty) => (
                            <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                        ))}
                    </select>
                    {errors.faculty_id && (
                        <p className="mt-1 text-xs text-destructive">{errors.faculty_id.message}</p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isSubmitting}>{kafedra ? 'Update' : 'Create'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default KafedraPage;
