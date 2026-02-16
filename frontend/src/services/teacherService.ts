import api from './api';

export interface Teacher {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    third_name: string;
    full_name: string;
    kafedra_id: number;
    created_at: string;
    updated_at: string;
}

export interface TeacherCreateRequest {
    first_name: string;
    last_name: string;
    third_name: string;
    kafedra_id: number;
    user_id: number;
}

export interface TeacherListResponse {
    total: number;
    page: number;
    limit: number;
    teachers: Teacher[];
}

export const teacherService = {
    getTeachers: async (page = 1, limit = 10, full_name?: string) => {
        const response = await api.get<TeacherListResponse>('/teacher/', {
            params: { page, limit, full_name },
        });
        return response.data;
    },

    getTeacherById: async (id: number): Promise<Teacher> => {
        const response = await api.get<Teacher>(`/teacher/${id}`);
        return response.data;
    },

    createTeacher: async (data: TeacherCreateRequest) => {
        const response = await api.post('/teacher/', data);
        return response.data;
    },

    updateTeacher: async (id: number, data: TeacherCreateRequest) => {
        const response = await api.put(`/teacher/${id}`, data);
        return response.data;
    },

    deleteTeacher: async (id: number) => {
        await api.delete(`/teacher/${id}`);
    },
};
