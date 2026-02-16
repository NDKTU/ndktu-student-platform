import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { type StartQuizResponse, type EndQuizResponse, type AnswerDTO } from '@/services/quizProcessService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PlayCircle, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trophy, Clock, ArrowLeft, LogOut } from 'lucide-react';
import { useStartQuiz, useEndQuiz } from '@/hooks/useQuizProcess';
import { useQuizzes } from '@/hooks/useQuizzes';
import { Modal } from '@/components/ui/Modal';

type QuizPhase = 'start' | 'quiz' | 'results';

const QuizTestPage = () => {
    const { user, logout } = useAuth();

    // Phase management
    const [phase, setPhase] = useState<QuizPhase>('start');

    // Start phase
    const { data: quizzesData, isLoading: isLoadingQuizzes } = useQuizzes(1, 100, undefined, true); // Fetch active quizzes
    const [selectedQuiz, setSelectedQuiz] = useState<{ id: number; title: string } | null>(null);
    const [pin, setPin] = useState('');
    const [startError, setStartError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Quiz phase
    const [quizData, setQuizData] = useState<StartQuizResponse | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);

    // Results phase
    const [results, setResults] = useState<EndQuizResponse | null>(null);

    const startQuizMutation = useStartQuiz();
    const endQuizMutation = useEndQuiz();

    // Timer
    useEffect(() => {
        if (phase !== 'quiz' || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOpenStartModal = (quiz: { id: number; title: string }) => {
        setSelectedQuiz(quiz);
        setPin('');
        setStartError('');
        setIsModalOpen(true);
    };

    const handleCloseStartModal = () => {
        setIsModalOpen(false);
        setSelectedQuiz(null);
        setPin('');
        setStartError('');
    };

    const handleStartQuiz = () => {
        if (!selectedQuiz || !pin) {
            setStartError('Please enter the PIN');
            return;
        }

        setStartError('');
        startQuizMutation.mutate({
            quiz_id: selectedQuiz.id,
            pin,
        }, {
            onSuccess: (data) => {
                setQuizData(data);
                setTimeLeft(data.duration * 60); // duration is in minutes
                setCurrentQuestionIndex(0);
                setAnswers({});
                setPhase('quiz');
                handleCloseStartModal();
            },
            onError: (error: any) => {
                const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to start quiz. Check your PIN.';
                setStartError(typeof message === 'string' ? message : 'Failed to start quiz.');
            }
        });
    };

    const handleSelectAnswer = (questionId: number, option: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = useCallback(() => {
        if (!quizData || endQuizMutation.isPending) return;

        const answerList: AnswerDTO[] = quizData.questions.map((q) => {
            const selectedKey = answers[q.id];
            let answerValue = '';

            if (selectedKey === 'A') answerValue = q.option_a;
            else if (selectedKey === 'B') answerValue = q.option_b;
            else if (selectedKey === 'C') answerValue = q.option_c;
            else if (selectedKey === 'D') answerValue = q.option_d;

            return {
                question_id: q.id,
                answer: answerValue,
            };
        });

        endQuizMutation.mutate({
            quiz_id: quizData.quiz_id,
            user_id: user?.id || null,
            answers: answerList,
        }, {
            onSuccess: (data) => {
                setResults(data);
                setPhase('results');
            },
            onError: (error) => {
                console.error('Failed to submit quiz', error);
                alert('Failed to submit quiz. Please try again.');
            }
        });
    }, [quizData, answers, user, endQuizMutation]);

    const handleRestart = () => {
        setPhase('start');
        setSelectedQuiz(null);
        setPin('');
        setQuizData(null);
        setAnswers({});
        setResults(null);
        setTimeLeft(0);
        setCurrentQuestionIndex(0);
    };

    // ================================
    // START PHASE
    // ================================
    if (phase === 'start') {
        const activeQuizzes = quizzesData?.quizzes || [];

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Available Quizzes</h1>
                        <p className="text-muted-foreground">Select a quiz to start</p>
                    </div>
                    <Button variant="danger" onClick={logout} size="sm">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>

                {isLoadingQuizzes ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : activeQuizzes.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <PlayCircle className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No Active Quizzes</h3>
                            <p className="text-muted-foreground">There are currently no quizzes available to take.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeQuizzes.map((quiz) => (
                            <Card key={quiz.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{quiz.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4" />
                                            <span>{quiz.question_number} Questions</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>{quiz.duration} Minutes</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleOpenStartModal(quiz)}
                                        className="w-full mt-auto"
                                    >
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        Start Quiz
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseStartModal}
                    title={`Start Quiz: ${selectedQuiz?.title}`}
                >
                    <div className="space-y-4">
                        <Input
                            label="Enter PIN"
                            type="text"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter the quiz PIN"
                            onKeyDown={(e) => e.key === 'Enter' && handleStartQuiz()}
                            autoFocus
                        />
                        {startError && (
                            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {startError}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCloseStartModal}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStartQuiz}
                                isLoading={startQuizMutation.isPending}
                            >
                                Start
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // ================================
    // RESULTS PHASE
    // ================================
    if (phase === 'results' && results) {
        const percentage = results.total_questions > 0
            ? Math.round((results.correct_answers / results.total_questions) * 100)
            : 0;

        const gradeColor =
            results.grade >= 80 ? 'text-green-600' :
                results.grade >= 60 ? 'text-yellow-600' :
                    'text-red-600';

        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Card className="w-full max-w-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <Trophy className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                        <p className="text-muted-foreground mt-1">{quizData?.title}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Grade Circle */}
                            <div className="flex justify-center">
                                <div className={`text-6xl font-bold ${gradeColor}`}>
                                    {results.grade.toFixed(1)}%
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-lg bg-muted p-4 text-center">
                                    <div className="text-2xl font-bold">{results.total_questions}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Total</div>
                                </div>
                                <div className="rounded-lg bg-green-50 p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-2xl font-bold text-green-600">{results.correct_answers}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Correct</div>
                                </div>
                                <div className="rounded-lg bg-red-50 p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-2xl font-bold text-red-600">{results.wrong_answers}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Wrong</div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Accuracy</span>
                                    <span className="font-medium">{percentage}%</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>

                            <Button className="w-full" onClick={handleRestart}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Take Another Quiz
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ================================
    // QUIZ PHASE
    // ================================
    if (!quizData) return null;

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const totalQuestions = quizData.questions.length;
    const answeredCount = Object.keys(answers).length;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const isFirstQuestion = currentQuestionIndex === 0;
    const selectedAnswer = answers[currentQuestion.id];

    const options = [
        { key: 'A', value: currentQuestion.option_a },
        { key: 'B', value: currentQuestion.option_b },
        { key: 'C', value: currentQuestion.option_c },
        { key: 'D', value: currentQuestion.option_d },
    ];

    const timeWarning = timeLeft < 60;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header with timer and progress */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{quizData.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {totalQuestions} • {answeredCount} answered
                    </p>
                </div>
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-lg font-mono font-bold ${timeWarning ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-muted'
                    }`}>
                    <Clock className="h-5 w-5" />
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Question navigation dots */}
            <div className="flex flex-wrap gap-2">
                {quizData.questions.map((q, index) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = index === currentQuestionIndex;
                    return (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${isCurrent
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                : isAnswered
                                    ? 'bg-green-500 text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                }`}
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>

            {/* Question Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {currentQuestionIndex + 1}
                        </span>
                        <div
                            className="text-lg font-medium leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((option) => {
                            const isSelected = selectedAnswer === option.key;
                            return (
                                <button
                                    key={option.key}
                                    onClick={() => handleSelectAnswer(currentQuestion.id, option.key)}
                                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${isSelected
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                        }`}
                                >
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {option.key}
                                    </span>
                                    <span
                                        className="pt-0.5"
                                        dangerouslySetInnerHTML={{ __html: option.value }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    disabled={isFirstQuestion}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>

                <div className="flex gap-2">
                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            isLoading={endQuizMutation.isPending}
                            disabled={answeredCount === 0}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submit Quiz ({answeredCount}/{totalQuestions})
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizTestPage;
