import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

import {
    Search,
    Bell,
    User,
    LogOut,
    Sun,
    Moon,

    ChevronDown,
    Settings
} from 'lucide-react';
import { cn } from '@/utils/utils';

const Navbar = () => {
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
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card px-6 shadow-sm transition-colors duration-300">
            {/* Left: Page Title / Breadcrumbs */}
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold capitalize text-foreground">
                    {getPageTitle(location.pathname)}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative hidden w-64 md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
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
                                <div className="px-2 py-1.5 text-sm font-semibold">
                                    My Account
                                </div>
                                <div className="mb-1 h-px bg-border" />
                                <Link
                                    to="/profile"
                                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                                <button
                                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </button>
                                <div className="my-1 h-px bg-border" />
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
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
