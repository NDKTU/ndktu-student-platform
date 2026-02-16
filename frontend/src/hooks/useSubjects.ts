import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectService } from '@/services/subjectService';

export const useSubjects = (page = 1, limit = 100, name?: string) => {
    return useQuery({
        queryKey: ['subjects', page, limit, name],
        queryFn: () => subjectService.getSubjects(page, limit, name),
    });
};

export const useSubject = (id: number) => {
    return useQuery({
        queryKey: ['subject', id],
        queryFn: () => subjectService.getSubjectById(id),
        enabled: !!id,
    });
};

export const useCreateSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string }) => subjectService.createSubject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};

export const useUpdateSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
            subjectService.updateSubject(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            queryClient.invalidateQueries({ queryKey: ['subject', data.id] });
        },
    });
};

export const useDeleteSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => subjectService.deleteSubject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};
