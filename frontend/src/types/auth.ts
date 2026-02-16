export interface User {
    id: number;
    username: string;
    role_id: number;
    is_active: boolean;
    roles: Role[];
    created_at: string;
    updated_at: string;
}

export interface UserCreateRequest {
    username: string;
    password?: string;
    role_id: number;
    is_active: boolean;
}

export interface Role {
    id: number;
    name: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    type: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
