export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Document {
    id: string;
    title: string;
    content: string;
    ownerId: string;
    collaborators: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentUpdate {
    documentId: string;
    userId: string;
    operation: Operation;
    timestamp: Date;
}

export interface Operation {
    type: "insert" | "delete" | "retain";
    index: number;
    text?: string;
    length?: number;
}

export interface CursorPosition {
    userId: string;
    userName: string;
    position: number;
    color: string;
}

export interface SocketEvents {
    // Client to Server
    "join-document": (documentId: string) => void;
    "leave-document": (documentId: string) => void;
    "document-operation": (operation: Operation, documentId: string) => void;
    "cursor-position": (position: CursorPosition, documentId: string) => void;

    // Server to Client
    "document-updated": (operation: Operation, userId: string) => void;
    "user-joined": (user: User) => void;
    "user-left": (userId: string) => void;
    "cursor-moved": (position: CursorPosition) => void;
    "document-loaded": (document: Document) => void;
    notification: (message: string, type: "info" | "warning" | "error") => void;
}

export interface AuthTokenPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
