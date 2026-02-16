import { useState } from 'react';
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loader2, FileText } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

const ResultsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const { user } = useAuth();

    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
    const userId = isStudent ? user?.id : undefined;

    const { data: resultsData, isLoading: isResultsLoading } = useResults(currentPage, pageSize, userId);

    const results = resultsData?.results || [];
    const totalPages = resultsData ? Math.ceil(resultsData.total / pageSize) : 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Results</h1>
                    <p className="text-muted-foreground">View student quiz performance</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Results</CardTitle>
                </CardHeader>
                <CardContent>
                    {isResultsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p>No results found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Quiz</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Correct / Total</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((result) => (
                                    <TableRow key={result.id}>
                                        <TableCell>{result.id}</TableCell>
                                        <TableCell className="font-medium">
                                            {result.user?.username || `User ${result.user_id}`}
                                        </TableCell>
                                        <TableCell>{result.quiz?.title || `Quiz ${result.quiz_id}`}</TableCell>
                                        <TableCell>
                                            <span className={
                                                result.grade >= 80 ? "text-green-600 font-medium" :
                                                    result.grade >= 50 ? "text-yellow-600" :
                                                        "text-red-600"
                                            }>
                                                {result.grade}%
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
