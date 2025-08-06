import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { DocumentsService } from "../documents/documents.service";
import { JwtService } from "@nestjs/jwt";

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.NODE_ENV === "production" ? true : [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3000", "http://127.0.0.1:3000"],
        credentials: true,
    },
})
export class DocumentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger("DocumentGateway");
    private connectedUsers = new Map<string, Set<string>>(); // documentId -> Set of userIds

    constructor(
        private documentsService: DocumentsService,
        private jwtService: JwtService
    ) {}

    afterInit(server: Server) {
        this.logger.log("WebSocket Gateway initialized");
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.userId = payload.userId;
            client.userName = payload.email;

            this.logger.log(`Client connected: ${client.id} (${client.userName})`);
        } catch (error) {
            this.logger.error("Invalid token", error);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Remove user from all documents
        this.connectedUsers.forEach((users, documentId) => {
            if (users.has(client.userId)) {
                users.delete(client.userId);
                client.to(documentId).emit("user-left", {
                    userId: client.userId,
                    userName: client.userName,
                });
            }
        });
    }

    @SubscribeMessage("join-document")
    async handleJoinDocument(@MessageBody() data: { documentId: string }, @ConnectedSocket() client: AuthenticatedSocket) {
        const { documentId } = data;

        // Check access
        const hasAccess = await this.documentsService.checkAccess(documentId, client.userId);

        if (!hasAccess) {
            client.emit("error", "You do not have access to this document");
            return;
        }

        // Join room
        client.join(documentId);

        // Track connected users
        if (!this.connectedUsers.has(documentId)) {
            this.connectedUsers.set(documentId, new Set());
        }
        this.connectedUsers.get(documentId).add(client.userId);

        // Load document
        const document = await this.documentsService.findById(documentId);
        client.emit("document-loaded", document);

        // Notify others
        client.to(documentId).emit("user-joined", {
            userId: client.userId,
            userName: client.userName,
        });

        this.logger.log(`User ${client.userName} joined document ${documentId}`);
    }

    @SubscribeMessage("leave-document")
    handleLeaveDocument(@MessageBody() data: { documentId: string }, @ConnectedSocket() client: AuthenticatedSocket) {
        const { documentId } = data;

        client.leave(documentId);

        // Remove from tracking
        if (this.connectedUsers.has(documentId)) {
            this.connectedUsers.get(documentId).delete(client.userId);
        }

        // Notify others
        client.to(documentId).emit("user-left", {
            userId: client.userId,
            userName: client.userName,
        });

        this.logger.log(`User ${client.userName} left document ${documentId}`);
    }

    @SubscribeMessage("document-operation")
    async handleDocumentOperation(
        @MessageBody()
        data: {
            documentId: string;
            operation: {
                type: "insert" | "delete" | "retain";
                index: number;
                text?: string;
                length?: number;
            };
        },
        @ConnectedSocket() client: AuthenticatedSocket
    ) {
        const { documentId, operation } = data;

        // Check access
        const hasAccess = await this.documentsService.checkAccess(documentId, client.userId);

        if (!hasAccess) {
            return;
        }

        // Apply operation to document
        const document = await this.documentsService.findById(documentId);
        if (!document) {
            return;
        }

        let newContent = document.content;

        switch (operation.type) {
            case "insert":
                newContent = newContent.slice(0, operation.index) + operation.text + newContent.slice(operation.index);
                break;
            case "delete":
                newContent = newContent.slice(0, operation.index) + newContent.slice(operation.index + operation.length);
                break;
        }

        // Save to database
        await this.documentsService.updateContent(documentId, newContent);

        // Broadcast to other users
        client.to(documentId).emit("document-updated", {
            operation,
            userId: client.userId,
            userName: client.userName,
        });

        this.logger.log(`Document operation by ${client.userName} on ${documentId}: ${operation.type}`);
    }

    @SubscribeMessage("cursor-position")
    handleCursorPosition(
        @MessageBody()
        data: {
            documentId: string;
            position: number;
            color: string;
        },
        @ConnectedSocket() client: AuthenticatedSocket
    ) {
        const { documentId, position, color } = data;

        // Broadcast cursor position to other users
        client.to(documentId).emit("cursor-moved", {
            userId: client.userId,
            userName: client.userName,
            position,
            color,
        });
    }
}
