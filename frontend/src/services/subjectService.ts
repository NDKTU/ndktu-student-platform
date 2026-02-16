import api from './api';

export interface Subject {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface SubjectListResponse {
    total: number;
    page: number;
    limit: number;
    subjects: Subject[];
}

export const subjectService = {
    getSubjects: async (page = 1, limit = 100, name?: string) => {
        const response = await api.get<SubjectListResponse>('/subject/', {
            params: { page, limit, name },
        });
        return response.data;
    },

    getSubjectById: async (id: number): Promise<Subject> => {
        const response = await api.get<Subject>(`/subject/${id}`);
        return response.data;
    },

    createSubject: async (data: { name: string }) => {
        const response = await api.post('/subject/', data);
        return response.data;
    },

    updateSubject: async (id: number, data: { name: string }) => {
        const response = await api.put(`/subject/${id}`, data);
        return response.data;
    },

    deleteSubject: async (id: number) => {
        await api.delete(`/subject/${id}`);
    },
};
