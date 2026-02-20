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
import { Loader2, FileText, FilterX } from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { useGroups } from '@/hooks/useGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useQuizzes } from '@/hooks/useQuizzes';

import { useAuth } from '@/context/AuthContext';

const ResultsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const { user } = useAuth();
    const navigate = useNavigate();

    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
    const userId = isStudent ? user?.id : undefined;

    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedQuiz, setSelectedQuiz] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');

    const parsedGroup = selectedGroup ? parseInt(selectedGroup, 10) : undefined;
    const parsedSubject = selectedSubject ? parseInt(selectedSubject, 10) : undefined;
    const parsedQuiz = selectedQuiz ? parseInt(selectedQuiz, 10) : undefined;
    const parsedGrade = selectedGrade ? parseInt(selectedGrade, 10) : undefined;

    const { data: resultsData, isLoading: isResultsLoading } = useResults(
        currentPage, pageSize, userId, parsedGrade, parsedGroup, parsedSubject, parsedQuiz
    );

    const { data: groupsData } = useGroups(1, 100, '');
    const { data: subjectsData } = useSubjects(1, 100, '');
    const { data: quizzesData } = useQuizzes(1, 100);

    const groupOptions = groupsData?.groups.map(g => ({ value: String(g.id), label: g.name })) || [];
    const subjectOptions = subjectsData?.subjects.map(s => ({ value: String(s.id), label: s.name })) || [];
    const quizOptions = quizzesData?.quizzes.map(q => ({ value: String(q.id), label: q.title })) || [];

    const results = resultsData?.results || [];
    const totalPages = resultsData ? Math.ceil(resultsData.total / pageSize) : 1;

    const handleClearFilters = () => {
        setSelectedGroup('');
        setSelectedSubject('');
        setSelectedQuiz('');
        setSelectedGrade('');
        setCurrentPage(1);
    };

    const handleRowClick = (result: typeof results[0]) => {
        const params = new URLSearchParams();
        if (result.user_id) params.set('user_id', String(result.user_id));
        if (result.quiz_id) params.set('quiz_id', String(result.quiz_id));
        navigate(`/results/answers?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="w-[200px]">
                            <label className="text-sm font-medium mb-1.5 block">Guruh</label>
                            <Combobox
                                options={groupOptions}
                                value={selectedGroup}
                                onChange={setSelectedGroup}
                                placeholder="Barcha guruhlar"
                            />
                        </div>
                        <div className="w-[200px]">
                            <label className="text-sm font-medium mb-1.5 block">Fan</label>
                            <Combobox
                                options={subjectOptions}
                                value={selectedSubject}
                                onChange={setSelectedSubject}
                                placeholder="Barcha fanlar"
                            />
                        </div>
                        <div className="w-[250px]">
                            <label className="text-sm font-medium mb-1.5 block">Test</label>
                            <Combobox
                                options={quizOptions}
                                value={selectedQuiz}
                                onChange={setSelectedQuiz}
                                placeholder="Barcha testlar"
                            />
                        </div>
                        <div className="w-[120px]">
                            <Input
                                type="number"
                                label="Ball"
                                placeholder="..."
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                min={1}
                                max={5}
                            />
                        </div>
                        {(selectedGroup || selectedSubject || selectedQuiz || selectedGrade) && (
                            <Button variant="ghost" className="mb-0.5" onClick={handleClearFilters}>
                                <FilterX className="h-4 w-4 mr-2" />
                                Tozalash
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

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
                                        <TableCell className="font-medium capitalize">
                                            <div>{result.student_name || result.user?.username || `Foydalanuvchi ${result.user_id}`}</div>
                                            {result.student_id && (
                                                <div className="text-xs text-muted-foreground normal-case">
                                                    ID: {result.student_id}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize">{result.subject?.name || '-'}</TableCell>
                                        <TableCell className="capitalize">{result.group?.name || '-'}</TableCell>
                                        <TableCell className="capitalize">{result.quiz?.title || `Test ${result.quiz_id}`}</TableCell>
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
