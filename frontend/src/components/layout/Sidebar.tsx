import { Link, useLocation } from 'react-router-dom';
import {
    Users,
    GraduationCap,
    BookOpen,
    FileText,
    BarChart,
    Shield,
    Key,
    Building2,
    Layers,
    UsersRound,
    FileQuestion,
    PlayCircle,
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { user } = useAuth();

    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');

    const basicNavigation = [
        { name: 'Dashboard', href: '/', icon: BarChart },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Teachers', href: '/teachers', icon: GraduationCap },
        { name: 'Roles', href: '/roles', icon: Shield },
        { name: 'Permissions', href: '/permissions', icon: Key },
        { name: 'Faculties', href: '/faculties', icon: Building2 },
        { name: 'Kafedras', href: '/kafedras', icon: Layers },
        { name: 'Groups', href: '/groups', icon: UsersRound },
        { name: 'Students', href: '/students', icon: GraduationCap },
        { name: 'Subjects', href: '/subjects', icon: BookOpen },
        { name: 'Questions', href: '/questions', icon: FileQuestion },
        { name: 'Quizzes', href: '/quizzes', icon: BookOpen },
    ];

    const studentNavigation = [
        { name: 'Take Quiz', href: '/quiz-test', icon: PlayCircle },
        { name: 'Results', href: '/results', icon: FileText },
    ];

    const navigation = isStudent
        ? studentNavigation
        : [...basicNavigation, ...studentNavigation];

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card transition-colors duration-300">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    NSUMT Admin
                </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;
