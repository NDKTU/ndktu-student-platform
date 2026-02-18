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
    username: z.string().min(1, 'Foydalanuvchi nomi kiritilishi shart'),
    password: z.string().min(1, 'Parol kiritilishi shart'),
});

const studentLoginSchema = z.object({
    login: z.string().min(1, 'Login/Talaba ID kiritilishi shart'),
    password: z.string().min(1, 'Parol kiritilishi shart'),
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
                setError('Login yoki parol noto\'g\'ri');
            } else {
                setError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
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
                setError('Ma\'lumotlar noto\'g\'ri yoki talaba topilmadi.');
            } else if (err.response?.status === 429) {
                setError('Urinishlar soni ko\'p. Keyinroq urinib ko\'ring.');
            }
            else {
                setError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
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
                        Tizimga kirish
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Quyida kirish usulini tanlang.
                    </p>
                </div>

                <div className="flex rounded-md bg-muted p-1 gap-1 bg-gray-100 p-1">
                    <button
                        type="button"
                        onClick={() => toggleLoginType('staff')}
                        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${loginType === 'staff'
                                ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Xodimlar
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleLoginType('student')}
                        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${loginType === 'student'
                                ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Talabalar (Hemis)
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
                                label="Foydalanuvchi nomi"
                                type="text"
                                autoComplete="username"
                                error={errorsStaff.username?.message?.toString()}
                                {...registerStaff('username')}
                            />

                            <Input
                                label="Parol"
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
                                Kirish
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmitStudent(onStudentSubmit)}>
                        <div className="space-y-4">
                            <Input
                                label="Talaba ID / Login"
                                type="text"
                                autoComplete="username"
                                error={errorsStudent.login?.message?.toString()}
                                {...registerStudent('login')}
                            />

                            <Input
                                label="Parol"
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
                                Hemis orqali kirish
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
