const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = localStorage.getItem("token");

        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(`${this.baseURL}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || "Network error");
        }

        return response.json();
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint);
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: "DELETE",
        });
    }
}

export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
    login: (email: string, password: string) => api.post<{ access_token: string; user: any }>("/auth/login", { email, password }),

    register: (email: string, password: string, name: string) => api.post<{ access_token: string; user: any }>("/auth/register", { email, password, name }),
};

// Documents API
export const documentsApi = {
    getAll: () => api.get("/documents"),

    getById: (id: string) => api.get(`/documents/${id}`),

    create: (title: string, content?: string) => api.post("/documents", { title, content }),

    update: (id: string, data: { title?: string; content?: string }) => api.put(`/documents/${id}`, data),

    delete: (id: string) => api.delete(`/documents/${id}`),

    share: (id: string, email: string) => api.post(`/documents/${id}/share`, { email }),
};
