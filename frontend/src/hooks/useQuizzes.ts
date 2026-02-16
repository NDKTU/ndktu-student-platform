import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService, type QuizCreateRequest } from '@/services/quizService';

export const useQuizzes = (page = 1, limit = 10, title?: string, is_active?: boolean) => {
    return useQuery({
        queryKey: ['quizzes', page, limit, title, is_active],
        queryFn: () => quizService.getQuizzes(page, limit, title, is_active),
        placeholderData: (previousData) => previousData,
    });
};

export const useQuiz = (id: number) => {
    return useQuery({
        queryKey: ['quiz', id],
        queryFn: () => quizService.getQuizById(id),
        enabled: !!id,
    });
};

export const useCreateQuiz = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: QuizCreateRequest) => quizService.createQuiz(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        },
    });
};

export const useUpdateQuiz = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: QuizCreateRequest }) => quizService.updateQuiz(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            queryClient.invalidateQueries({ queryKey: ['quiz', variables.id] });
        },
    });
};

export const useDeleteQuiz = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => quizService.deleteQuiz(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        },
    });
};
