import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { Subject } from '@/services/subjectService';
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
import { Plus, Pencil, Trash2, Loader2, BookOpen, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';

const subjectSchema = z.object({
    name: z.string().min(1, 'Subject name is required'),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

const SubjectsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
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

    const { data: subjectsData, isLoading: isSubjectsLoading } = useSubjects(currentPage, pageSize, debouncedSearch);
    const deleteSubjectMutation = useDeleteSubject();

    const subjects = subjectsData?.subjects || [];
    const totalPages = subjectsData ? Math.ceil(subjectsData.total / pageSize) : 1;

    const handleDeleteClick = (subject: Subject) => {
        setSubjectToDelete(subject);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!subjectToDelete) return;

        deleteSubjectMutation.mutate(subjectToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSubjectToDelete(null);
            },
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
                    <p className="text-muted-foreground">Manage subjects</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search subjects..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setSelectedSubject(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Subject
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                    {isSubjectsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                            <p>No subjects found.</p>
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
                                {subjects.map((subject) => (
                                    <TableRow key={subject.id}>
                                        <TableCell>{subject.id}</TableCell>
                                        <TableCell className="font-medium">{subject.name}</TableCell>
                                        <TableCell>{new Date(subject.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedSubject(subject); setIsModalOpen(true); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(subject)}
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
                isLoading={isSubjectsLoading}
            />

            <SubjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                subject={selectedSubject}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Subject"
                description={`Are you sure you want to delete '${subjectToDelete?.name}'? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const SubjectModal = ({
    isOpen,
    onClose,
    subject,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    subject: Subject | null;
    onSuccess: (subject?: Subject) => void;
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SubjectFormValues>({
        resolver: zodResolver(subjectSchema),
    });

    const createMutation = useCreateSubject();
    const updateMutation = useUpdateSubject();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (subject) {
            reset({
                name: subject.name,
            });
        } else {
            reset({
                name: '',
            });
        }
    }, [subject, reset]);

    const onSubmit = (data: SubjectFormValues) => {
        if (subject) {
            updateMutation.mutate({ id: subject.id, data }, {
                onSuccess: (data) => onSuccess(data),
                onError: (error) => {
                    console.error('Failed to update subject', error);
                    alert('Failed to update subject');
                }
            });
        } else {
            createMutation.mutate(data, {
                onSuccess: (data) => onSuccess(data),
                onError: (error) => {
                    console.error('Failed to create subject', error);
                    alert('Failed to create subject');
                }
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={subject ? 'Edit Subject' : 'Create Subject'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Subject Name"
                    {...register('name')}
                    error={errors.name?.message}
                    placeholder="Enter subject name"
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {subject ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SubjectsPage;
