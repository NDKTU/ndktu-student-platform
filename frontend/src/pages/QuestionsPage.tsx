import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useNavigate } from 'react-router-dom';
import type { Question } from '@/services/questionService';
import type { Subject } from '@/services/subjectService';
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
import { Plus, Pencil, Trash2, Loader2, FileQuestion, Upload, FileUp, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useQuestions, useDeleteQuestion, useUploadQuestions } from '@/hooks/useQuestions';
import { useSubjects } from '@/hooks/useSubjects';
import { useUsers } from '@/hooks/useUsers';
import { Input } from '@/components/ui/Input';

const QuestionsPage = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: questionsData, isLoading: isQuestionsLoading } = useQuestions(currentPage, pageSize, debouncedSearch);
    const { data: subjectsData } = useSubjects(1, 100);
    const { data: usersData } = useUsers(1, 100);
    const deleteQuestionMutation = useDeleteQuestion();

    const questions = questionsData?.questions || [];
    const totalPages = questionsData ? Math.ceil(questionsData.total / pageSize) : 1;
    const subjects = subjectsData?.subjects || [];
    const users = usersData?.users || [];

    const handleCreateQuestion = () => {
        navigate('/questions/create');
    };

    const handleEditQuestion = (question: Question, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        navigate(`/questions/${question.id}/edit`);
    };

    const handleDeleteClick = (question: Question, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        setQuestionToDelete(question);
        setIsDeleteModalOpen(true);
    };

    const handleViewQuestion = (question: Question) => {
        setSelectedQuestion(question);
        setIsDetailModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!questionToDelete) return;
        deleteQuestionMutation.mutate(questionToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setQuestionToDelete(null);
            },
        });
    };

    const handleSuccess = () => {
        setIsUploadModalOpen(false);
    };

    const getSubjectName = (id?: number) => subjects.find(s => s.id === id)?.name || '-';
    const getUserName = (id?: number) => users.find(u => u.id === id)?.username || '-';

    // Helper to strip HTML tags for preview
    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
                    <p className="text-muted-foreground">Manage exam questions</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions..."
                            className="pl-8 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Excel
                    </Button>
                    <Button onClick={handleCreateQuestion}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Questions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isQuestionsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileQuestion className="h-12 w-12 mb-4 opacity-20" />
                            <p>No questions found. Add one manually or import from Excel.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50%]">Question</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.map((question) => {
                                    const plainText = stripHtml(question.text);
                                    return (
                                        <TableRow
                                            key={question.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleViewQuestion(question)}
                                        >
                                            <TableCell className="font-medium">
                                                <div
                                                    className="break-words max-w-md"
                                                    title={plainText}
                                                >
                                                    {plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getSubjectName(question.subject_id)}</TableCell>
                                            <TableCell>{getUserName(question.user_id)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleEditQuestion(question, e)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={(e) => handleDeleteClick(question, e)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isQuestionsLoading}
            />

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleSuccess}
                subjects={subjects}
            />

            <QuestionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                question={selectedQuestion}
                getSubjectName={getSubjectName}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Question"
                description="Are you sure you want to delete this question? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const QuestionDetailModal = ({
    isOpen,
    onClose,
    question,
    getSubjectName,
}: {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    getSubjectName: (id?: number) => string;
}) => {
    if (!question) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Question Details"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Question Body</h3>
                    <div
                        className="rounded-lg border bg-muted/50 p-4 text-sm"
                        dangerouslySetInnerHTML={{ __html: question.text }}
                    />
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Options</h3>
                    <div className="grid gap-3">
                        {[
                            { label: 'A', value: question.option_a },
                            { label: 'B', value: question.option_b },
                            { label: 'C', value: question.option_c },
                            { label: 'D', value: question.option_d },
                        ].map((option) => (
                            <div key={option.label} className="flex gap-3 items-start">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                    {option.label}
                                </div>
                                <div
                                    className="w-full rounded-lg border p-3 text-sm min-h-[3rem]"
                                    dangerouslySetInnerHTML={{ __html: option.value }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t mt-4">
                    <p className="text-sm text-muted-foreground">
                        Subject: <span className="font-medium text-foreground">{getSubjectName(question.subject_id)}</span>
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};

const UploadModal = ({
    isOpen,
    onClose,
    onSuccess,
    subjects,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    subjects: Subject[];
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [subjectId, setSubjectId] = useState<string>('');
    const uploadMutation = useUploadQuestions();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file || !subjectId) return;
        uploadMutation.mutate({ file, subject_id: parseInt(subjectId) }, {
            onSuccess: () => {
                onSuccess();
            },
            onError: (error) => {
                console.error('Failed to upload file', error);
                alert('Failed to upload file');
            }
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Questions from Excel"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-10">
                    <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                        Select an Excel file (.xlsx) to upload
                    </p>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-violet-50 file:text-violet-700
                        hover:file:bg-violet-100"
                    />
                </div>
                {file && (
                    <div className="text-sm">
                        Selected file: <span className="font-medium">{file.name}</span>
                    </div>
                )}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleUpload} isLoading={uploadMutation.isPending} disabled={!file || !subjectId}>
                        Upload
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default QuestionsPage;
