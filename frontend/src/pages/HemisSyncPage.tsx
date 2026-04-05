import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, RefreshCw, UserCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { hemisService } from '@/services/hemisService';

const HemisSyncPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const login = searchParams.get('login');
    const password = searchParams.get('password');

    // 1. Fetch preview data from Hemis
    const { data: previewData, isLoading: isPreviewLoading, isPending, isError, error: previewError } = useQuery({
        queryKey: ['hemisPreview', login],
        queryFn: () => hemisService.previewAdminData({ login: login!, password: password! }),
        enabled: !!login && !!password,
        retry: false,
    });

    // 2. Sync mutation
    const syncMutation = useMutation({
        mutationFn: () => hemisService.syncAdminData({ login: login!, password: password! }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            alert('Sinxronlash muvaffaqiyatli amalga oshirildi!');
            navigate('/students');
        },
        onError: (err: any) => {
            alert(err?.response?.data?.detail || err?.message || 'Sinxronlashda xatolik yuz berdi');
        }
    });

    if (!login || !password) {
        return (
            <div className="p-8 text-center max-w-lg mx-auto mt-10">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Noto'g'ri so'rov</h2>
                <p className="text-muted-foreground mb-6">Login yoki parol taqdim etilmagan.</p>
                <Button onClick={() => navigate('/students')}><ArrowLeft className="w-4 h-4 mr-2"/> Orqaga qaytish</Button>
            </div>
        );
    }

    if (isPreviewLoading || isPending) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg font-medium text-muted-foreground">App tizimi (Hemis) bilan bog'lanilmoqda...</p>
            </div>
        );
    }

    if (isError || previewError) {
        return (
            <div className="p-8 text-center max-w-lg mx-auto mt-10">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Hemisga ulanishda xatolik</h2>
                <div className="text-red-700 bg-red-50 p-4 rounded-md mb-6 border border-red-100 font-medium">
                    {(previewError as any)?.response?.data?.detail || previewError?.message || 'Noma\'lum xato'}
                </div>
                <Button onClick={() => navigate('/students')}><ArrowLeft className="w-4 h-4 mr-2"/> Talabalar ro'yxatiga qaytish</Button>
            </div>
        );
    }

    // Safely extract properties using optional chaining
    const existsInDb = previewData?.exists_in_db;
    const hData = previewData?.hemis_data || {};
    const existingResults = previewData?.existing_results || [];
    const suggestedGroup = previewData?.suggested_group || 'N/A';

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Talaba Ma'lumotlarini Sinxronlash (Hemis)</h1>
                    <p className="text-muted-foreground mt-1">Sinxronlashdan oldin ma'lumotlarni tasdiqlash</p>
                </div>
                <div className="ml-auto">
                    <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {syncMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                        Sinxronlash va Saqlash
                    </Button>
                </div>
            </div>

            {/* Exist Indicators */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Bazada mavjudmi?</span>
                    {existsInDb ? (
                        <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mavjud</span> 
                    ) : (
                        <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><XCircle className="w-3.5 h-3.5 mr-1" /> Yangi Talaba</span>
                    )}
                </div>
                <div className="flex items-center gap-2 border-l pl-4">
                    <span className="text-sm font-medium">Tavsiya etilgan guruh:</span>
                    <span className="text-sm font-semibold">{suggestedGroup}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* External Column / Hemis Data */}
                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b">
                        <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            Yangi Ma'lumotlar (Hemis Tizimidan)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">F.I.SH</span>
                            <span className="col-span-2 font-medium">{hData?.full_name || hData?.first_name || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">ID Raqami</span>
                            <span className="col-span-2">{hData?.student_id_number || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Guruh (Hemis)</span>
                            <span className="col-span-2">{hData?.group?.name || hData?.group || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Fakultet</span>
                            <span className="col-span-2">{hData?.faculty?.name || hData?.faculty || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Bosqich / Semestr</span>
                            <span className="col-span-2">{hData?.level || '-'} - kurs, {hData?.semester || '-'}-semestr</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Mutaxassislik</span>
                            <span className="col-span-2">{hData?.specialty?.name || hData?.specialty || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-semibold text-muted-foreground text-sm">Maxsus</span>
                            <span className="col-span-2">
                                Telefon: {hData?.phone || 'N/A'} | Holati: {hData?.student_status?.name || hData?.student_status || '-'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Local Impacts / Test Results Column */}
                <Card className={existsInDb ? 'border-amber-100 shadow-sm' : 'border-dashed shadow-none border-2 bg-muted/10'}>
                    <CardHeader className={existsInDb ? 'bg-amber-50/50 dark:bg-amber-900/10 border-b' : 'border-b border-dashed'}>
                        <CardTitle className="flex items-center gap-2">
                            {existsInDb ? <AlertCircle className="w-5 h-5 text-amber-500" /> : <UserCheck className="w-5 h-5 text-green-600 dark:text-green-500" />}
                            Mahalliy Ta'sir (Baza)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {existsInDb ? (
                            <div className="space-y-4">
                                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-md text-sm mb-4 border border-amber-200">
                                    Ushbu talaba (yoki shu nom/ID dagi foydalanuvchi) bazamizda allaqachon ro'yxatdan o'tgan. 
                                    Sinxronlash amalga oshirilsa, quyidagi Hemis ma'lumotlari ustiga yoziladi.
                                </div>
                                
                                {existingResults?.length > 0 ? (
                                    <div className="pt-2 border-t">
                                        <h4 className="font-semibold mb-3 text-sm flex items-center justify-between">
                                            <span>Mavjud Test Natijalari (Bazada {existingResults.length} ta)</span>
                                        </h4>
                                        <div className="space-y-2">
                                            {existingResults.map((r: any, idx: number) => (
                                                <div key={r?.id || idx} className="text-xs bg-muted p-3 rounded-md flex justify-between items-center shadow-sm border border-border/50">
                                                    <div>
                                                        <span className="font-medium block mb-1">{r?.quiz?.title || 'Noma\'lum Test'}</span>
                                                        <span className="text-muted-foreground">{r?.subject?.name || 'Fan mavjud emas'}</span>
                                                    </div>
                                                    <span className="font-bold text-green-600 dark:text-green-500 bg-green-50 px-2 py-1 rounded">
                                                        {Number(r?.grade || 0).toFixed(1)} / 5
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-4 pt-4 border-t text-sm text-muted-foreground italic flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Bu talaba hali hech qanday test topshirmagan.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-center mt-8">
                                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-muted-foreground">Yangi Talaba</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                                    Bu arxiv talaba platforma bazasida topilmadi. U birinchi marta bazaga kiritilib test topshirish huquqiga ega bo'ladi.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HemisSyncPage;
