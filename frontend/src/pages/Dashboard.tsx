import { useAuth } from '@/context/AuthContext';
import {
    Users,
    BookOpen,
    GraduationCap,
    CheckCircle,
    FileQuestion,
    Book,
    UserCheck,
    LogOut,
    Activity,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { teacherService } from '@/services/teacherService';
import { studentService } from '@/services/studentService';
import { subjectService } from '@/services/subjectService';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { resultService } from '@/services/resultService';
import { Button } from '@/components/ui/Button';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    className?: string;
    description?: string;
    isLoading?: boolean;
    trend?: string;
    color?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
}

const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    className,
    description,
    isLoading,
    color = 'blue'
}) => (
    <div className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
    )}>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon className="h-24 w-24" />
        </div>

        <div className="relative z-10">
            <div className={cn("inline-flex rounded-xl p-3 mb-4", colorMap[color])}>
                <Icon className="h-6 w-6" />
            </div>

            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {isLoading ? (
                    <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
                ) : (
                    <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                )}
                {description && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>{description}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { user, logout } = useAuth();

    const { data: users, isLoading: isUsersLoading } = useQuery({
        queryKey: ['dashboard-users'],
        queryFn: () => userService.getUsers(1, 1),
    });

    const { data: teachers, isLoading: isTeachersLoading } = useQuery({
        queryKey: ['dashboard-teachers'],
        queryFn: () => teacherService.getTeachers(1, 1),
    });

    const { data: students, isLoading: isStudentsLoading } = useQuery({
        queryKey: ['dashboard-students'],
        queryFn: () => studentService.getStudents(1, 1),
    });

    const { data: subjects, isLoading: isSubjectsLoading } = useQuery({
        queryKey: ['dashboard-subjects'],
        queryFn: () => subjectService.getSubjects(1, 1),
    });

    const { data: quizzes, isLoading: isQuizzesLoading } = useQuery({
        queryKey: ['dashboard-quizzes'],
        queryFn: () => quizService.getQuizzes(1, 1),
    });

    const { data: questions, isLoading: isQuestionsLoading } = useQuery({
        queryKey: ['dashboard-questions'],
        queryFn: () => questionService.getQuestions(1, 1),
    });

    const { data: results, isLoading: isResultsLoading } = useQuery({
        queryKey: ['dashboard-results'],
        queryFn: () => resultService.getResults(1, 1),
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Xayrli tong';
        if (hour < 18) return 'Xayrli kun';
        return 'Xayrli kech';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {getGreeting()}, {user?.username}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Universitet tizimidagi bugungi yangiliklar va ko'rsatkichlar.
                    </p>
                </div>
                <Button variant="danger" onClick={logout} className="shadow-lg hover:shadow-xl transition-all">
                    <LogOut className="mr-2 h-4 w-4" />
                    Chiqish
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Faol foydalanuvchilar"
                    value={users?.total || 0}
                    icon={Users}
                    isLoading={isUsersLoading}
                    color="blue"
                    description="O'tgan oyga nisbatan +12%"
                />
                <StatCard
                    label="Jami talabalar"
                    value={students?.total || 0}
                    icon={UserCheck}
                    isLoading={isStudentsLoading}
                    color="purple"
                    description="Faol o'qiyotganlar"
                />
                <StatCard
                    label="O'qituvchilar"
                    value={teachers?.total || 0}
                    icon={GraduationCap}
                    isLoading={isTeachersLoading}
                    color="cyan"
                    description="Barcha kafedralar bo'yicha"
                />
                <StatCard
                    label="Faol testlar"
                    value={quizzes?.total || 0}
                    icon={BookOpen}
                    isLoading={isQuizzesLoading}
                    color="pink"
                    description="Talabalar uchun ochiq"
                />
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                    label="Savollar banki"
                    value={questions?.total || 0}
                    icon={FileQuestion}
                    isLoading={isQuestionsLoading}
                    color="orange"
                    description="Jami savollar bazasi"
                />
                <StatCard
                    label="Yaratilgan fanlar"
                    value={subjects?.total || 0}
                    icon={Book}
                    isLoading={isSubjectsLoading}
                    color="green"
                    description="Faol kurslar"
                />
                <StatCard
                    label="Yakunlangan testlar"
                    value={results?.total || 0}
                    icon={CheckCircle}
                    isLoading={isResultsLoading}
                    color="blue"
                    description="Jami topshirilganlar"
                />
            </div>

            {/* System Overview / Activity Widget */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Tizim holati</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-medium">Ma'lumotlar bazasi aloqasi</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Barqaror</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-medium">API tarmoq shlyuzi</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Ishlamoqda</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center bg-gradient-to-br from-card to-primary/5">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Akademik mukammallik</h2>
                    <p className="text-muted-foreground">Kengaytirilgan boshqaruv paneli orqali muassasangizning akademik resurslarini samarali boshqaring.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
