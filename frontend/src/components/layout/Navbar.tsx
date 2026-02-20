import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

import {
    Bell,
    User,
    LogOut,
    Sun,
    Moon,
    Menu,
    ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/utils';

interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Helper to get page title based on path
    const getPageTitle = (pathname: string) => {
        const path = pathname.split('/')[1];
        if (!path) return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 backdrop-blur-md px-6 shadow-sm transition-colors duration-300">
            {/* Left: Page Title / Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
                    title="Toggle Menu"
                >
                    <Menu className="h-4 w-4" />
                </button>
                <h1 className="text-xl font-semibold capitalize text-foreground">
                    {getPageTitle(location.pathname)}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}


                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? (
                        <Moon className="h-4 w-4" />
                    ) : (
                        <Sun className="h-4 w-4" />
                    )}
                </button>

                {/* Notifications (Placeholder) */}
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    title="Notifications"
                >
                    <Bell className="h-4 w-4" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 rounded-full border border-input bg-background p-1 pr-3 hover:bg-accent transition-colors"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                            {user?.student?.image_path ? (
                                <img
                                    src={user.student.image_path}
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-4 w-4" />
                            )}
                        </div>
                        <span className="hidden text-sm font-medium md:block">
                            {user?.username || 'User'}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isProfileOpen && "rotate-180")} />
                    </button>

                    {isProfileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsProfileOpen(false)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-md border bg-popover p-2 shadow-md animate-in fade-in zoom-in-95 duration-200">

                                <Link
                                    to="/profile"
                                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Profil
                                </Link>

                                <div className="my-1 h-px bg-border" />
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Chiqish
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
