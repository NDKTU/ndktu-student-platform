import { useState } from 'react';
import { Trophy, Loader2, Medal, Crown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import {
    useTeacherRankingOverall,
    useTeacherRankingByFaculty,
    useTeacherRankingByKafedra,
    useTeacherRankingByGroup,
} from '@/hooks/useTeachers';
import { useFaculties, useKafedras } from '@/hooks/useReferenceData';
import { useGroups } from '@/hooks/useGroups';
import type { TeacherRankItem, RankingScope } from '@/services/teacherService';

// ─── Scope tab labels ────────────────────────────────────────────────────────
const SCOPES: { value: RankingScope; label: string }[] = [
    { value: 'overall', label: "Umumiy (Universitet)" },
    { value: 'faculty', label: "Fakultet bo'yicha" },
    { value: 'kafedra', label: "Kafedra bo'yicha" },
    { value: 'group', label: "Guruh bo'yicha" },
];

// ─── Medal badge for top 3 ───────────────────────────────────────────────────
const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" aria-label="#1" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" aria-label="#2" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" aria-label="#3" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
};

// ─── Colour gradient cell for avg_grade ──────────────────────────────────────
const GradeCell = ({ avg }: { avg: number }) => {
    const pct = Math.min(avg / 100, 1);
    const r = Math.round(220 - pct * 120);
    const g = Math.round(80 + pct * 140);
    return (
        <span
            className="inline-block rounded px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: `rgb(${r},${g},80)` }}
        >
            {avg.toFixed(2)}
        </span>
    );
};

// ─── Ranking table ────────────────────────────────────────────────────────────
const RankingTable = ({ items, showGroup }: { items: TeacherRankItem[]; showGroup?: boolean }) => {
    if (items.length === 0) {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <Trophy className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>Ma'lumotlar topilmadi. O'qituvchilar uchun natijalar yo'q.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16 text-center">O'rin</TableHead>
                    <TableHead>F.I.SH</TableHead>
                    <TableHead>Kafedra</TableHead>
                    <TableHead>Fakultet</TableHead>
                    {showGroup && <TableHead>Guruh</TableHead>}
                    <TableHead className="text-right">Talabalar</TableHead>
                    <TableHead className="text-right">Jami ball</TableHead>
                    <TableHead className="text-right">O'rtacha ball</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow
                        key={item.teacher_id}
                        className={item.rank <= 3 ? 'bg-primary/5' : ''}
                    >
                        <TableCell className="text-center">
                            <RankBadge rank={item.rank} />
                        </TableCell>
                        <TableCell className="font-medium capitalize">{item.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {item.kafedra_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {item.faculty_name ?? '—'}
                        </TableCell>
                        {showGroup && (
                            <TableCell className="text-sm text-muted-foreground">
                                {item.group_name ?? '—'}
                            </TableCell>
                        )}
                        <TableCell className="text-right">{item.student_count}</TableCell>
                        <TableCell className="text-right">{item.total_grade}</TableCell>
                        <TableCell className="text-right">
                            <GradeCell avg={item.avg_grade} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ─── Scope-specific panels ───────────────────────────────────────────────────
const OverallRanking = () => {
    const { data, isLoading } = useTeacherRankingOverall();
    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    return <RankingTable items={data?.teachers ?? []} />;
};

const FacultyRanking = () => {
    const { data: facData } = useFaculties();
    const faculties = facData?.faculties ?? [];
    const [facultyId, setFacultyId] = useState<number | undefined>();
    const { data, isLoading } = useTeacherRankingByFaculty(facultyId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-72">
                    <Combobox
                        options={faculties.map((f) => ({ value: String(f.id), label: f.name }))}
                        value={facultyId ? String(facultyId) : ''}
                        onChange={(v) => setFacultyId(v ? Number(v) : undefined)}
                        placeholder="Fakultetni tanlang..."
                        searchPlaceholder="Qidirish..."
                    />
                </div>
                {facultyId && (
                    <Button variant="ghost" size="sm" onClick={() => setFacultyId(undefined)}>
                        Tozalash
                    </Button>
                )}
            </div>
            {!facultyId ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    Reytingni ko'rish uchun fakultetni tanlang.
                </p>
            ) : isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <RankingTable items={data?.teachers ?? []} />
            )}
        </div>
    );
};

const KafedraRanking = () => {
    const { data: kafData } = useKafedras();
    const kafedras = kafData?.kafedras ?? [];
    const [kafedraId, setKafedraId] = useState<number | undefined>();
    const { data, isLoading } = useTeacherRankingByKafedra(kafedraId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-72">
                    <Combobox
                        options={kafedras.map((k) => ({ value: String(k.id), label: k.name }))}
                        value={kafedraId ? String(kafedraId) : ''}
                        onChange={(v) => setKafedraId(v ? Number(v) : undefined)}
                        placeholder="Kafedrani tanlang..."
                        searchPlaceholder="Qidirish..."
                    />
                </div>
                {kafedraId && (
                    <Button variant="ghost" size="sm" onClick={() => setKafedraId(undefined)}>
                        Tozalash
                    </Button>
                )}
            </div>
            {!kafedraId ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    Reytingni ko'rish uchun kafedrani tanlang.
                </p>
            ) : isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <RankingTable items={data?.teachers ?? []} />
            )}
        </div>
    );
};

const GroupRanking = () => {
    const { data: groupsData } = useGroups(1, 500, '');
    const groups = groupsData?.groups ?? [];
    const [groupId, setGroupId] = useState<number | undefined>();
    const { data, isLoading } = useTeacherRankingByGroup(groupId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-72">
                    <Combobox
                        options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
                        value={groupId ? String(groupId) : ''}
                        onChange={(v) => setGroupId(v ? Number(v) : undefined)}
                        placeholder="Guruhni tanlang..."
                        searchPlaceholder="Qidirish..."
                    />
                </div>
                {groupId && (
                    <Button variant="ghost" size="sm" onClick={() => setGroupId(undefined)}>
                        Tozalash
                    </Button>
                )}
            </div>
            {!groupId ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    Reytingni ko'rish uchun guruhni tanlang.
                </p>
            ) : isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <RankingTable items={data?.teachers ?? []} showGroup />
            )}
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const TeacherRankingPage = () => {
    const [scope, setScope] = useState<RankingScope>('overall');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    O'qituvchilar reytingi
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Talabalar o'rtacha bahosi bo'yicha o'qituvchilar reytingi
                </p>
            </div>

            {/* Scope tabs */}
            <div className="flex gap-2 flex-wrap">
                {SCOPES.map(({ value, label }) => (
                    <Button
                        key={value}
                        variant={scope === value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setScope(value)}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {/* Ranking card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {SCOPES.find((s) => s.value === scope)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {scope === 'overall' && <OverallRanking />}
                    {scope === 'faculty' && <FacultyRanking />}
                    {scope === 'kafedra' && <KafedraRanking />}
                    {scope === 'group' && <GroupRanking />}
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherRankingPage;
