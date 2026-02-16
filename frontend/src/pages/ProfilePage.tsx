import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Shield, Key, Calendar } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();

    // Format date if available (assuming backend provides created_at or updated_at, usually available)
    // If not, we'll skip or use placeholder


    if (!user) return null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1 border-primary/20 bg-gradient-to-b from-card to-primary/5">
                    <CardContent className="flex flex-col items-center pt-8 pb-8 space-y-4">
                        <div className="relative">
                            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 border-4 border-background shadow-xl">
                                <User className="h-16 w-16 text-primary" />
                            </div>
                            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background" />
                        </div>
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-bold">{user.username}</h2>
                            <p className="text-sm text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full inline-block">
                                {user.roles?.map(r => r.name).join(', ') || 'User'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>Personal information and account status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Username
                                </label>
                                <div className="p-3 bg-muted/50 rounded-lg font-medium border border-transparent hover:border-border transition-colors">
                                    {user.username}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Roles
                                </label>
                                <div className="p-3 bg-muted/50 rounded-lg font-medium border border-transparent hover:border-border transition-colors">
                                    {user.roles?.map(r => r.name).join(', ') || 'No roles'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    User ID
                                </label>
                                <div className="p-3 bg-muted/50 rounded-lg font-medium border border-transparent hover:border-border transition-colors font-mono">
                                    #{user.id}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Status
                                </label>
                                <div className="p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg font-medium border border-transparent flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    Active
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="text-lg font-semibold mb-4">Security</h3>
                            <Button variant="outline" className="w-full sm:w-auto">
                                Change Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
