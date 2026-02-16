import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/services/api';
import { hemisService } from '@/services/hemisService';

const staffLoginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

const studentLoginSchema = z.object({
    login: z.string().min(1, 'Login/Student ID is required'),
    password: z.string().min(1, 'Password is required'),
});

type StaffLoginFormValues = z.infer<typeof staffLoginSchema>;
type StudentLoginFormValues = z.infer<typeof studentLoginSchema>;

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loginType, setLoginType] = useState<'staff' | 'student'>('staff');
    const [error, setError] = React.useState<string | null>(null);

    const from = location.state?.from?.pathname || '/';

    const {
        register: registerStaff,
        handleSubmit: handleSubmitStaff,
        formState: { errors: errorsStaff, isSubmitting: isSubmittingStaff },
        reset: resetStaff,
    } = useForm<StaffLoginFormValues>({
        resolver: zodResolver(staffLoginSchema),
    });

    const {
        register: registerStudent,
        handleSubmit: handleSubmitStudent,
        formState: { errors: errorsStudent, isSubmitting: isSubmittingStudent },
        reset: resetStudent,
    } = useForm<StudentLoginFormValues>({
        resolver: zodResolver(studentLoginSchema),
    });

    const onStaffSubmit = async (data: StaffLoginFormValues) => {
        try {
            setError(null);
            const response = await api.post('/user/login', data);
            await login(response.data.access_token, response.data.refresh_token);
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 400) {
                setError('Invalid username or password');
            } else {
                setError('Something went wrong. Please try again.');
            }
        }
    };

    const onStudentSubmit = async (data: StudentLoginFormValues) => {
        try {
            setError(null);
            const response = await hemisService.login(data);
            await login(response.access_token, response.refresh_token);
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error(err);
             if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 404) {
                setError('Invalid credentials or student not found.');
            } else if (err.response?.status === 429) {
                 setError('Too many login attempts. Please try again later.');
            }
            else {
                setError('Something went wrong. Please try again.');
            }
        }
    };

    const toggleLoginType = (type: 'staff' | 'student') => {
        setLoginType(type);
        setError(null);
        if (type === 'staff') resetStudent();
        else resetStaff();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Select your login method below.
                    </p>
                </div>

                <div className="flex rounded-md bg-muted p-1 gap-1 bg-gray-100 p-1">
                    <button
                        type="button"
                        onClick={() => toggleLoginType('staff')}
                        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                            loginType === 'staff'
                                ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Staff Login
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleLoginType('student')}
                        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                            loginType === 'student'
                                ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Student Login (Hemis)
                    </button>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive dark:text-red-400 bg-red-50 text-red-600 border border-red-200">
                        {error}
                    </div>
                )}

                {loginType === 'staff' ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmitStaff(onStaffSubmit)}>
                        <div className="space-y-4">
                            <Input
                                label="Username"
                                type="text"
                                autoComplete="username"
                                error={errorsStaff.username?.message?.toString()}
                                {...registerStaff('username')}
                            />

                            <Input
                                label="Password"
                                type="password"
                                autoComplete="current-password"
                                error={errorsStaff.password?.message?.toString()}
                                {...registerStaff('password')}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isSubmittingStaff}
                            >
                                Sign in as Staff
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmitStudent(onStudentSubmit)}>
                        <div className="space-y-4">
                            <Input
                                label="Student ID / Login"
                                type="text"
                                autoComplete="username"
                                error={errorsStudent.login?.message?.toString()}
                                {...registerStudent('login')}
                            />

                            <Input
                                label="Password"
                                type="password"
                                autoComplete="current-password"
                                error={errorsStudent.password?.message?.toString()}
                                {...registerStudent('password')}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isSubmittingStudent}
                            >
                                Sign in with Hemis
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
