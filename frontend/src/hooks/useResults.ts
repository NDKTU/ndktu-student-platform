import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultService } from '@/services/resultService';

export const useResults = (page = 1, limit = 10, userId?: number) => {
    return useQuery({
        queryKey: ['results', page, limit, userId],
        queryFn: () => userId
            ? resultService.getUserResults(userId, page, limit)
            : resultService.getResults(page, limit),
        placeholderData: (previousData) => previousData,
    });
};

export const useUserResults = (userId: number, page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userResults', userId, page, limit],
        queryFn: () => resultService.getUserResults(userId, page, limit),
        enabled: !!userId,
        placeholderData: (previousData) => previousData,
    });
};

export const useResult = (id: number) => {
    return useQuery({
        queryKey: ['result', id],
        queryFn: () => resultService.getResultById(id),
        enabled: !!id,
    });
};

export const useDeleteResult = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => resultService.deleteResult(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['results'] });
            queryClient.invalidateQueries({ queryKey: ['userResults'] });
        },
    });
};
