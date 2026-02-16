import api from './api';

export interface Student {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    third_name: string;
    full_name: string;
    group_id: number;
    created_at: string;
    updated_at: string;
}

export interface StudentCreateRequest {
    first_name: string;
    last_name: string;
    third_name: string;
    group_id: number;
    user_id: number; // Links to a user in the auth system
}

export interface StudentListResponse {
    total: number;
    page: number;
    limit: number;
    students: Student[];
}

export const studentService = {
    getStudents: async (page = 1, limit = 10, full_name?: string) => {
        const response = await api.get<StudentListResponse>('/students/', {
            params: { page, limit, full_name },
        });
        return response.data;
    },



    createStudent: async (data: StudentCreateRequest): Promise<Student> => {
        const response = await api.post<Student>('/students/', data);
        return response.data;
    },

    getStudentById: async (id: number): Promise<Student> => {
        const response = await api.get<Student>(`/students/${id}`);
        return response.data;
    },

    updateStudent: async (id: number, data: StudentCreateRequest): Promise<Student> => {
        const response = await api.put<Student>(`/students/${id}`, data);
        return response.data;
    },

    deleteStudent: async (id: number): Promise<void> => {
        await api.delete(`/students/${id}`);
    },
};
