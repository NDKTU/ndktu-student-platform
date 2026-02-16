import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { Quiz, QuizCreateRequest } from '@/services/quizService';
import type { Subject } from '@/services/subjectService';
import type { Group } from '@/services/groupService';
import type { User } from '@/types/auth';
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
import { Plus, Pencil, Trash2, Loader2, BookOpen, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuizzes, useCreateQuiz, useUpdateQuiz, useDeleteQuiz } from '@/hooks/useQuizzes';
import { useSubjects } from '@/hooks/useSubjects';
import { useGroups } from '@/hooks/useGroups';
import { useUsers } from '@/hooks/useUsers';

const quizSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    question_number: z.string().min(1, 'Question number is required').refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Must be a positive number'),
    duration: z.string().min(1, 'Duration is required').refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Must be a positive number'),
    pin: z.string().min(4, 'PIN is required'),
    user_id: z.string().optional(),
    group_id: z.string().optional(),
    subject_id: z.string().optional(),
    is_active: z.boolean(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

const QuizzesPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: quizzesData, isLoading: isQuizzesLoading } = useQuizzes(currentPage, pageSize, debouncedSearch);
    const { data: subjectsData } = useSubjects(1, 100);
    const { data: groupsData } = useGroups(1, 100);
    const { data: usersData } = useUsers(1, 100);

    const updateQuizMutation = useUpdateQuiz();
    const deleteQuizMutation = useDeleteQuiz();

    const quizzes = quizzesData?.quizzes || [];
    const totalPages = quizzesData ? Math.ceil(quizzesData.total / pageSize) : 1;
    const subjects = subjectsData?.subjects || [];
    const groups = groupsData?.groups || [];
    const users = usersData?.users || [];

    const handleCreateQuiz = () => {
        setSelectedQuiz(null);
        setIsModalOpen(true);
    };

    const handleEditQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (quiz: Quiz) => {
        setQuizToDelete(quiz);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!quizToDelete) return;
        deleteQuizMutation.mutate(quizToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setQuizToDelete(null);
            },
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
    };

    const handleToggleStatus = (quiz: Quiz) => {
        setIsUpdatingStatus(quiz.id);
        const payload: QuizCreateRequest = {
            title: quiz.title,
            question_number: quiz.question_number,
            duration: quiz.duration,
            pin: quiz.pin,
            user_id: quiz.user_id || undefined, // undefined to send as optional/null-like
            group_id: quiz.group_id || undefined,
            subject_id: quiz.subject_id || undefined,
            is_active: !quiz.is_active,
        };

        // Note: The backend expects specific types, here we assume update handles partial or full updates
        // However, looking at the schema, it seems we might need to send all fields.
        // We are using the same payload structure.

        updateQuizMutation.mutate({ id: quiz.id, data: payload }, {
            onSettled: () => {
                setIsUpdatingStatus(null);
            },
            onError: (error) => {
                console.error('Failed to update quiz status', error);
                alert('Failed to update quiz status');
            }
        });
    };

    const getSubjectName = (id?: number) => subjects.find(s => s.id === id)?.name || '-';
    const getGroupName = (id?: number) => groups.find(g => g.id === id)?.name || '-';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
                    <p className="text-muted-foreground">Manage quizzes and tests</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search quizzes..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreateQuiz}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quiz
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
                    {isQuizzesLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                            <p>No quizzes found. Create one to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Q/N</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>PIN</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Group</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quizzes.map((quiz) => (
                                    <TableRow key={quiz.id}>
                                        <TableCell className="font-medium">{quiz.title}</TableCell>
                                        <TableCell>{quiz.question_number}</TableCell>
                                        <TableCell>{quiz.duration} min</TableCell>
                                        <TableCell><span className="font-mono bg-muted px-2 py-1 rounded">{quiz.pin}</span></TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={quiz.is_active}
                                                    onCheckedChange={() => handleToggleStatus(quiz)}
                                                    disabled={isUpdatingStatus === quiz.id || updateQuizMutation.isPending}
                                                />
                                                <span className={`text-xs ${quiz.is_active ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                                    {quiz.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getSubjectName(quiz.subject_id)}</TableCell>
                                        <TableCell>{getGroupName(quiz.group_id)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditQuiz(quiz)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(quiz)}
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
                isLoading={isQuizzesLoading}
            />

            <QuizModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                quiz={selectedQuiz}
                subjects={subjects}
                groups={groups}
                users={users}
                onSuccess={handleSuccess}
            />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Quiz"
                description={`Are you sure you want to delete the quiz "${quizToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const QuizModal = ({
    isOpen,
    onClose,
    quiz,
    subjects,
    groups,
    users,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    quiz: Quiz | null;
    subjects: Subject[];
    groups: Group[];
    users: User[];
    onSuccess: () => void;
}) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<QuizFormValues>({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: '',
            is_active: false,
        }
    });

    const createMutation = useCreateQuiz();
    const updateMutation = useUpdateQuiz();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const isActive = watch('is_active');

    useEffect(() => {
        if (quiz) {
            reset({
                title: quiz.title,
                question_number: quiz.question_number.toString(),
                duration: quiz.duration.toString(),
                pin: quiz.pin,
                user_id: quiz.user_id ? quiz.user_id.toString() : '',
                group_id: quiz.group_id ? quiz.group_id.toString() : '',
                subject_id: quiz.subject_id ? quiz.subject_id.toString() : '',
                is_active: quiz.is_active,
            });
        } else {
            reset({
                title: '',
                question_number: '10', // Default
                duration: '30', // Default
                pin: Math.random().toString().slice(2, 6), // Generate random PIN
                user_id: '',
                group_id: '',
                subject_id: '',
                is_active: false,
            });
        }
    }, [quiz, reset, isOpen]);

    const onSubmit = (data: QuizFormValues) => {
        const payload: QuizCreateRequest = {
            title: data.title,
            question_number: parseInt(data.question_number, 10),
            duration: parseInt(data.duration, 10),
            pin: data.pin,
            user_id: data.user_id ? parseInt(data.user_id, 10) : undefined,
            group_id: data.group_id ? parseInt(data.group_id, 10) : undefined,
            subject_id: data.subject_id ? parseInt(data.subject_id, 10) : undefined,
            is_active: data.is_active,
        };

        if (quiz) {
            updateMutation.mutate({ id: quiz.id, data: payload }, {
                onSuccess: () => onSuccess(),
                onError: (error) => {
                    console.error('Failed to update quiz', error);
                    alert('Failed to update quiz');
                }
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => onSuccess(),
                onError: (error) => {
                    console.error('Failed to create quiz', error);
                    alert('Failed to create quiz');
                }
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={quiz ? 'Edit Quiz' : 'Create Quiz'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Title"
                    {...register('title')}
                    error={errors.title?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Questions Count"
                        type="number"
                        {...register('question_number')}
                        error={errors.question_number?.message}
                    />
                    <Input
                        label="Duration (min)"
                        type="number"
                        {...register('duration')}
                        error={errors.duration?.message}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="PIN Code"
                        {...register('pin')}
                        error={errors.pin?.message}
                    />
                    <div className="flex items-center space-x-2 pt-8">
                        <Switch
                            id="modal-is-active"
                            checked={isActive}
                            onCheckedChange={(checked) => setValue('is_active', checked)}
                        />
                        <label htmlFor="modal-is-active" className="text-sm font-medium leading-none cursor-pointer">
                            Active
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('subject_id')}
                    >
                        <option value="">Select a subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Group</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('group_id')}
                    >
                        <option value="">Select a group</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Teacher/User</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('user_id')}
                    >
                        <option value="">Select a user</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {quiz ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default QuizzesPage;
