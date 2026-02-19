import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '@/components/ui/Pagination';
import { useResults } from '@/hooks/useResults';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, FileText } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

const ResultsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const { user } = useAuth();
    const navigate = useNavigate();

    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
    const userId = isStudent ? user?.id : undefined;

    const { data: resultsData, isLoading: isResultsLoading } = useResults(currentPage, pageSize, userId);

    const results = resultsData?.results || [];
    const totalPages = resultsData ? Math.ceil(resultsData.total / pageSize) : 1;

    const handleRowClick = (result: typeof results[0]) => {
        const params = new URLSearchParams();
        if (result.user_id) params.set('user_id', String(result.user_id));
        if (result.quiz_id) params.set('quiz_id', String(result.quiz_id));
        navigate(`/results/answers?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    {isResultsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p>Natijalar topilmadi.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Talaba</TableHead>
                                    <TableHead>Fan</TableHead>
                                    <TableHead>Guruh</TableHead>
                                    <TableHead>Test</TableHead>
                                    <TableHead>Ball</TableHead>
                                    <TableHead>To'g'ri / Jami</TableHead>
                                    <TableHead>Sana</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((result) => (
                                    <TableRow
                                        key={result.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(result)}
                                    >
                                        <TableCell>{result.id}</TableCell>
                                        <TableCell className="font-medium">
                                            <div>{result.student_name || result.user?.username || `Foydalanuvchi ${result.user_id}`}</div>
                                            {result.student_id && (
                                                <div className="text-xs text-muted-foreground">
                                                    ID: {result.student_id}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{result.subject?.name || '-'}</TableCell>
                                        <TableCell>{result.group?.name || '-'}</TableCell>
                                        <TableCell>{result.quiz?.title || `Test ${result.quiz_id}`}</TableCell>
                                        <TableCell>
                                            <span className={
                                                result.grade == 5 ? "text-green-600 font-medium" :
                                                    (result.grade == 4 || result.grade == 3) ? "text-yellow-600" :
                                                        "text-red-600"
                                            }>
                                                {result.grade}
                                            </span>
                                        </TableCell>
                                        <TableCell>{result.correct_answers} / {result.correct_answers + result.wrong_answers}</TableCell>
                                        <TableCell>{new Date(result.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isResultsLoading}
            />
        </div>
    );
};

export default ResultsPage;
