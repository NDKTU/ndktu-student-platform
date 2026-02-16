import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services/groupService';

export const useGroups = (page = 1, limit = 100, name?: string) => {
    return useQuery({
        queryKey: ['groups', page, limit, name],
        queryFn: () => groupService.getGroups(page, limit, name),
    });
};

export const useGroup = (id: number) => {
    return useQuery({
        queryKey: ['group', id],
        queryFn: () => groupService.getGroupById(id),
        enabled: !!id,
    });
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; faculty_id: number }) => groupService.createGroup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
};

export const useUpdateGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name: string; faculty_id: number } }) =>
            groupService.updateGroup(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['group', data.id] });
        },
    });
};

export const useDeleteGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => groupService.deleteGroup(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
};
