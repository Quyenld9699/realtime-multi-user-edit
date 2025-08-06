export type Socket = SocketIOClient.Socket;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

class SocketManager {
    private socket: Socket | null = null;
    private token: string | null = null;

    connect(token: string): Socket {
        this.token = token;

        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(SOCKET_URL, {
            auth: {
                token,
            },
        });

        this.socket.on("connect", () => {
            console.log("Connected to server");
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        this.socket.on("error", (error: string) => {
            console.error("Socket error:", error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Document operations
    joinDocument(documentId: string) {
        this.socket?.emit("join-document", { documentId });
    }

    leaveDocument(documentId: string) {
        this.socket?.emit("leave-document", { documentId });
    }

    sendOperation(
        documentId: string,
        operation: {
            type: "insert" | "delete" | "retain";
            index: number;
            text?: string;
            length?: number;
        }
    ) {
        this.socket?.emit("document-operation", { documentId, operation });
    }

    sendCursorPosition(documentId: string, position: number, color: string) {
        this.socket?.emit("cursor-position", { documentId, position, color });
    }

    // Event listeners
    onDocumentLoaded(callback: (document: any) => void) {
        this.socket?.on("document-loaded", callback);
    }

    onDocumentUpdated(callback: (data: any) => void) {
        this.socket?.on("document-updated", callback);
    }

    onUserJoined(callback: (user: any) => void) {
        this.socket?.on("user-joined", callback);
    }

    onUserLeft(callback: (data: any) => void) {
        this.socket?.on("user-left", callback);
    }

    onCursorMoved(callback: (data: any) => void) {
        this.socket?.on("cursor-moved", callback);
    }

    onNotification(callback: (message: string, type: string) => void) {
        this.socket?.on("notification", callback);
    }

    // Remove listeners
    off(event: string, callback?: Function) {
        this.socket?.off(event, callback);
    }
}

export const socketManager = new SocketManager();
