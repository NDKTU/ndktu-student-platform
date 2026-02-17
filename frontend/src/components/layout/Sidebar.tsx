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
        { name: 'Test', href: '/quiz-test', icon: PlayCircle },
        { name: 'Natija', href: '/results', icon: FileText },
    ];

    const navigation = isStudent
        ? studentNavigation
        : [...basicNavigation, ...studentNavigation];

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
                    "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r bg-card transition-all duration-300 md:static",
                    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "flex h-16 items-center border-b px-4 cursor-pointer hover:bg-accent/50 transition-colors", 
                    isCollapsed ? "justify-center" : "justify-start gap-4"
                )}
            >
                <img 
                    src={logo} 
                    alt="Logo" 
                    className="h-10 w-10 object-contain"
                />
                {!isCollapsed && (
                    <span className="text-xs font-semibold leading-snug text-foreground">
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
                                    "flex items-center rounded-md transition-all duration-200",
                                    isCollapsed 
                                        ? "h-10 w-10 justify-center p-0" 
                                        : "px-3 py-2 text-sm font-medium",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
