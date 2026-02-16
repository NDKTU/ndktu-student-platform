import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { QuestionCreateRequest } from '@/services/questionService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuestion, useCreateQuestion, useUpdateQuestion } from '@/hooks/useQuestions';
import { useSubjects } from '@/hooks/useSubjects';

const questionSchema = z.object({
    subject_id: z.string().min(1, 'Subject is required'),
    text: z.string().min(1, 'Question text is required'),
    option_a: z.string().min(1, 'Option A is required'),
    option_b: z.string().min(1, 'Option B is required'),
    option_c: z.string().min(1, 'Option C is required'),
    option_d: z.string().min(1, 'Option D is required'),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const QuestionFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!id;
    const questionId = id ? parseInt(id, 10) : 0;

    const { data: subjectsData } = useSubjects(1, 100);
    const { data: question, isLoading: isQuestionLoading } = useQuestion(questionId);

    const createMutation = useCreateQuestion();
    const updateMutation = useUpdateQuestion();

    const subjects = subjectsData?.subjects || [];
    const isSubmitting = createMutation.isPending || updateMutation.isPending;
    const isLoading = isEditMode && isQuestionLoading;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<QuestionFormValues>({
        resolver: zodResolver(questionSchema),
        defaultValues: {
            subject_id: '',
            text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
        }
    });

    useEffect(() => {
        if (question) {
            reset({
                subject_id: question.subject_id.toString(),
                text: question.text,
                option_a: question.option_a,
                option_b: question.option_b,
                option_c: question.option_c,
                option_d: question.option_d,
            });
        }
    }, [question, reset]);

    const onSubmit = (data: QuestionFormValues) => {
        if (!user) {
            alert('User not authenticated');
            return;
        }

        const payload: QuestionCreateRequest = {
            subject_id: parseInt(data.subject_id, 10),
            user_id: user.id,
            text: data.text,
            option_a: data.option_a,
            option_b: data.option_b,
            option_c: data.option_c,
            option_d: data.option_d,
        };
        
        const onSuccess = () => {
             navigate('/questions');
        };
        
        const onError = (error: unknown) => {
            console.error('Failed to save question', error);
            alert('Failed to save question');
        }

        if (isEditMode && id) {
            updateMutation.mutate({ id: parseInt(id), data: payload }, { onSuccess, onError });
        } else {
            createMutation.mutate(payload, { onSuccess, onError });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/questions')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{isEditMode ? 'Edit Question' : 'Create Question'}</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Question Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('subject_id')}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {errors.subject_id && <p className="text-xs text-destructive">{errors.subject_id.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Question Text</label>
                            <Controller
                                name="text"
                                control={control}
                                render={({ field }) => (
                                    <JoditEditor
                                        value={field.value}
                                        onBlur={(newContent: string) => field.onChange(newContent)}
                                        onChange={() => { }}
                                    />
                                )}
                            />
                            {errors.text && <p className="text-xs text-destructive">{errors.text.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Option A</label>
                                <Controller
                                    name="option_a"
                                    control={control}
                                    render={({ field }) => (
                                        <JoditEditor
                                            value={field.value}
                                            onBlur={(newContent: string) => field.onChange(newContent)}
                                            onChange={() => { }}
                                        />
                                    )}
                                />
                                {errors.option_a && <p className="text-xs text-destructive">{errors.option_a.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Option B</label>
                                <Controller
                                    name="option_b"
                                    control={control}
                                    render={({ field }) => (
                                        <JoditEditor
                                            value={field.value}
                                            onBlur={(newContent: string) => field.onChange(newContent)}
                                            onChange={() => { }}
                                        />
                                    )}
                                />
                                {errors.option_b && <p className="text-xs text-destructive">{errors.option_b.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Option C</label>
                                <Controller
                                    name="option_c"
                                    control={control}
                                    render={({ field }) => (
                                        <JoditEditor
                                            value={field.value}
                                            onBlur={(newContent: string) => field.onChange(newContent)}
                                            onChange={() => { }}
                                        />
                                    )}
                                />
                                {errors.option_c && <p className="text-xs text-destructive">{errors.option_c.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Option D</label>
                                <Controller
                                    name="option_d"
                                    control={control}
                                    render={({ field }) => (
                                        <JoditEditor
                                            value={field.value}
                                            onBlur={(newContent: string) => field.onChange(newContent)}
                                            onChange={() => { }}
                                        />
                                    )}
                                />
                                {errors.option_d && <p className="text-xs text-destructive">{errors.option_d.message}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate('/questions')}>Cancel</Button>
                            <Button type="submit" isLoading={isSubmitting}>
                                {isEditMode ? 'Update Question' : 'Create Question'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default QuestionFormPage;
