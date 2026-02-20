import { useState } from 'react';
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

import logo from '@/assets/logo.png';

interface SidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const Sidebar = ({ mobileOpen, setMobileOpen }: SidebarProps) => {
    const location = useLocation();
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
    const isTeacher = user?.roles?.some(role => role.name.toLowerCase() === 'teacher');

    const adminNavigation = [
        { name: 'Boshqaruv paneli', href: '/', icon: BarChart },
        { name: 'Foydalanuvchilar', href: '/users', icon: Users },
        { name: "O'qituvchilar", href: '/teachers', icon: GraduationCap },
        { name: 'Rollar', href: '/roles', icon: Shield },
        { name: 'Ruxsatlar', href: '/permissions', icon: Key },
        { name: 'Fakultetlar', href: '/faculties', icon: Building2 },
        { name: 'Kafedralar', href: '/kafedras', icon: Layers },
        { name: 'Guruhlar', href: '/groups', icon: UsersRound },
        { name: 'Talabalar', href: '/students', icon: GraduationCap },
        { name: 'Fanlar', href: '/subjects', icon: BookOpen },
        { name: 'Savollar', href: '/questions', icon: FileQuestion },
        { name: 'Testlar', href: '/quizzes', icon: BookOpen },
        { name: 'Test', href: '/quiz-test', icon: PlayCircle },
        { name: 'Natijalar', href: '/results', icon: FileText },
    ];

    const teacherNavigation = [
        { name: 'Savollar', href: '/questions', icon: FileQuestion },
        { name: 'Natijalar', href: '/results', icon: FileText },
    ];

    const studentNavigation = [
        { name: 'Test', href: '/quiz-test', icon: PlayCircle },
        { name: 'Natijalar', href: '/results', icon: FileText },
    ];

    const navigation = isStudent
        ? studentNavigation
        : isTeacher
            ? teacherNavigation
            : adminNavigation;

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r bg-card/95 backdrop-blur-md shadow-lg transition-all duration-300 md:static",
                    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "flex h-16 items-center border-b px-4 cursor-pointer transition-all duration-300",
                        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent",
                        isCollapsed ? "justify-center" : "justify-start gap-3"
                    )}
                >
                    <img
                        src={logo}
                        alt="NDKTU Logo"
                        className={cn(
                            "object-contain shrink-0 transition-all duration-300 drop-shadow-sm",
                            isCollapsed ? "h-10 w-10" : "h-11 w-11"
                        )}
                    />
                    {!isCollapsed && (
                        <span className="text-xs font-bold leading-tight tracking-tight text-foreground/90">
                            Navoiy davlat konchilik va texnologiyalar universiteti
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className={cn("flex flex-col space-y-2 px-2", isCollapsed ? "items-center" : "")}>
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    title={isCollapsed ? item.name : undefined}
                                    className={cn(
                                        "flex items-center rounded-lg transition-all duration-200 hover:-translate-y-0.5",
                                        isCollapsed
                                            ? "h-10 w-10 justify-center p-0"
                                            : "px-3 py-2 text-sm font-medium",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")} />
                                    {!isCollapsed && <span>{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
