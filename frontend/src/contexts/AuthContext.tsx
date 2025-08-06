"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/lib/api";
import { socketManager } from "@/lib/socket";

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load token from localStorage on mount
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            socketManager.connect(savedToken);
        }

        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login(email, password);
            const { access_token, user: userData } = response;

            setToken(access_token);
            setUser(userData);

            localStorage.setItem("token", access_token);
            localStorage.setItem("user", JSON.stringify(userData));

            socketManager.connect(access_token);
        } catch (error) {
            throw error;
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            const response = await authApi.register(email, password, name);
            const { access_token, user: userData } = response;

            setToken(access_token);
            setUser(userData);

            localStorage.setItem("token", access_token);
            localStorage.setItem("user", JSON.stringify(userData));

            socketManager.connect(access_token);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        socketManager.disconnect();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                register,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
