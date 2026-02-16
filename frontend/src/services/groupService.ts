import api from './api';

export interface Group {
    id: number;
    name: string;
    faculty_id: number;
    created_at: string;
    updated_at: string;
}

export interface GroupListResponse {
    total: number;
    page: number;
    limit: number;
    groups: Group[];
}

export const groupService = {
    getGroups: async (page = 1, limit = 100, name?: string) => {
        const response = await api.get<GroupListResponse>('/group/', {
            params: { page, limit, name },
        });
        return response.data;
    },

    getGroupById: async (id: number): Promise<Group> => {
        const response = await api.get<Group>(`/group/${id}`);
        return response.data;
    },

    createGroup: async (data: { name: string; faculty_id: number }) => {
        const response = await api.post('/group/', data);
        return response.data;
    },

    updateGroup: async (id: number, data: { name: string; faculty_id: number }) => {
        const response = await api.put(`/group/${id}`, data);
        return response.data;
    },

    deleteGroup: async (id: number) => {
        await api.delete(`/group/${id}`);
    },
};
