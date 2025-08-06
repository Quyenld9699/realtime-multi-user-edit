"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { documentsApi } from "@/lib/api";
import { socketManager } from "@/lib/socket";
import { ArrowLeft, Share, Users, Save } from "lucide-react";

interface Document {
    _id: string;
    title: string;
    content: string;
    ownerId: any;
    collaborators: any[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ConnectedUser {
    userId: string;
    userName: string;
    color: string;
}

interface CursorPosition {
    userId: string;
    userName: string;
    position: number;
    color: string;
}

const CURSOR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"];

export default function DocumentEditor() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const documentId = params.id as string;

    const [document, setDocument] = useState<Document | null>(null);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
    const [cursors, setCursors] = useState<CursorPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState("");

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cursorPositionRef = useRef(0);
    const myColorRef = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);
    const lastCursorSentRef = useRef(0);
    const cursorThrottleRef = useRef<NodeJS.Timeout | null>(null);

    // Throttled cursor position sender
    const sendCursorPositionThrottled = useCallback(
        (position: number) => {
            if (cursorThrottleRef.current) {
                clearTimeout(cursorThrottleRef.current);
            }

            cursorThrottleRef.current = setTimeout(() => {
                if (position !== lastCursorSentRef.current) {
                    socketManager.sendCursorPosition(documentId, position, myColorRef.current);
                    lastCursorSentRef.current = position;
                }
            }, 50); // 50ms throttle
        },
        [documentId]
    );

    // Get accurate cursor position using canvas measurement
    const getCursorPosition = useCallback(
        (cursorIndex: number) => {
            if (typeof window === "undefined" || !textareaRef.current || cursorIndex < 0 || cursorIndex > content.length) {
                return { left: 0, top: 0 };
            }

            const textarea = textareaRef.current;
            const textareaStyle = window.getComputedStyle(textarea);
            const fontSize = parseFloat(textareaStyle.fontSize);
            const lineHeight = parseFloat(textareaStyle.lineHeight) || fontSize * 1.5;
            const paddingLeft = parseFloat(textareaStyle.paddingLeft);
            const paddingTop = parseFloat(textareaStyle.paddingTop);

            // Split text into lines to calculate position
            const textBeforeCursor = content.slice(0, cursorIndex);
            const lines = textBeforeCursor.split("\n");
            const lineNumber = lines.length - 1;
            const textInCurrentLine = lines[lineNumber] || "";

            // Create canvas to measure text width accurately
            const canvas = window.document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (context) {
                // Set canvas font to match textarea
                context.font = `${textareaStyle.fontWeight} ${textareaStyle.fontSize} ${textareaStyle.fontFamily}`;

                // Measure width of text in current line up to cursor
                const textWidth = context.measureText(textInCurrentLine).width;

                return {
                    left: paddingLeft + textWidth,
                    top: paddingTop + lineNumber * lineHeight,
                };
            }

            // Fallback to estimation if canvas not available
            const charWidth = fontSize * 0.6;
            return {
                left: paddingLeft + textInCurrentLine.length * charWidth,
                top: paddingTop + lineNumber * lineHeight,
            };
        },
        [content]
    );

    // Load document
    useEffect(() => {
        if (!documentId || !user) return;

        const loadDocument = async () => {
            try {
                setIsLoading(true);
                const doc = await documentsApi.getById(documentId);
                setDocument(doc as Document);
                setContent((doc as any).content || "");
                setTitle((doc as any).title || "");
            } catch (error: any) {
                setError(error.message || "Failed to load document");
            } finally {
                setIsLoading(false);
            }
        };

        loadDocument();
    }, [documentId, user]);

    // Socket connection and event listeners
    useEffect(() => {
        if (!documentId || !socketManager.isConnected()) return;

        // Join document room
        socketManager.joinDocument(documentId);

        // Listen for document updates
        const handleDocumentUpdated = (data: any) => {
            const { operation, userId } = data;

            if (userId === user?.id) return; // Ignore own updates

            setContent((prevContent) => {
                let newContent = prevContent;

                switch (operation.type) {
                    case "insert":
                        newContent = prevContent.slice(0, operation.index) + operation.text + prevContent.slice(operation.index);
                        break;
                    case "delete":
                        newContent = prevContent.slice(0, operation.index) + prevContent.slice(operation.index + operation.length);
                        break;
                }

                return newContent;
            });
        };

        const handleUserJoined = (userData: any) => {
            setConnectedUsers((prev) => {
                const exists = prev.find((u) => u.userId === userData.userId);
                if (exists) return prev;

                return [
                    ...prev,
                    {
                        userId: userData.userId,
                        userName: userData.userName,
                        color: CURSOR_COLORS[prev.length % CURSOR_COLORS.length],
                    },
                ];
            });
        };

        const handleUserLeft = (userData: any) => {
            setConnectedUsers((prev) => prev.filter((u) => u.userId !== userData.userId));
            setCursors((prev) => prev.filter((c) => c.userId !== userData.userId));
        };

        const handleCursorMoved = (data: CursorPosition) => {
            setCursors((prev) => {
                const filtered = prev.filter((c) => c.userId !== data.userId);
                return [...filtered, data];
            });
        };

        // Add event listeners
        socketManager.onDocumentUpdated(handleDocumentUpdated);
        socketManager.onUserJoined(handleUserJoined);
        socketManager.onUserLeft(handleUserLeft);
        socketManager.onCursorMoved(handleCursorMoved);

        // Cleanup
        return () => {
            socketManager.leaveDocument(documentId);
            socketManager.off("document-updated", handleDocumentUpdated);
            socketManager.off("user-joined", handleUserJoined);
            socketManager.off("user-left", handleUserLeft);
            socketManager.off("cursor-moved", handleCursorMoved);

            // Clear cursor throttle timeout
            if (cursorThrottleRef.current) {
                clearTimeout(cursorThrottleRef.current);
            }
        };
    }, [documentId, user]);

    // Handle text changes
    const handleContentChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newContent = e.target.value;
            const cursorPosition = e.target.selectionStart;

            if (content !== newContent) {
                const oldContent = content;

                // Calculate the operation
                let operation;

                if (newContent.length > oldContent.length) {
                    // Insert operation
                    const insertIndex = cursorPosition - (newContent.length - oldContent.length);
                    const insertedText = newContent.slice(insertIndex, cursorPosition);

                    operation = {
                        type: "insert" as const,
                        index: insertIndex,
                        text: insertedText,
                    };
                } else if (newContent.length < oldContent.length) {
                    // Delete operation
                    const deleteLength = oldContent.length - newContent.length;

                    operation = {
                        type: "delete" as const,
                        index: cursorPosition,
                        length: deleteLength,
                    };
                }

                if (operation) {
                    socketManager.sendOperation(documentId, operation);
                }
            }

            setContent(newContent);
            cursorPositionRef.current = cursorPosition;

            // Send cursor position when typing (throttled)
            sendCursorPositionThrottled(cursorPosition);
        },
        [content, documentId]
    );

    // Handle cursor position changes
    const handleCursorMove = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const position = e.target.selectionStart;
            cursorPositionRef.current = position;

            sendCursorPositionThrottled(position);
        },
        [sendCursorPositionThrottled]
    );

    // Handle cursor position for different event types
    const handleCursorMoveKeyboard = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            const position = e.currentTarget.selectionStart;
            cursorPositionRef.current = position;

            sendCursorPositionThrottled(position);
        },
        [sendCursorPositionThrottled]
    );

    const handleCursorMoveMouse = useCallback(
        (e: React.MouseEvent<HTMLTextAreaElement>) => {
            const position = e.currentTarget.selectionStart;
            cursorPositionRef.current = position;

            sendCursorPositionThrottled(position);
        },
        [sendCursorPositionThrottled]
    );

    // Save document
    const saveDocument = async () => {
        if (!document || isSaving) return;

        try {
            setIsSaving(true);
            await documentsApi.update(documentId, { title, content });
        } catch (error: any) {
            setError(error.message || "Failed to save document");
        } finally {
            setIsSaving(false);
        }
    };

    // Share document
    const shareDocument = async () => {
        if (!shareEmail.trim()) return;

        try {
            await documentsApi.share(documentId, shareEmail.trim());
            setShareEmail("");
            setShowShareModal(false);
            // You might want to show a success message here
        } catch (error: any) {
            setError(error.message || "Failed to share document");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Loading document...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.push("/dashboard")} className="flex items-center text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Back
                            </button>

                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveDocument}
                                className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
                                placeholder="Untitled Document"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Connected Users */}
                            <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <div className="flex -space-x-2">
                                    {connectedUsers.slice(0, 5).map((user, index) => (
                                        <div
                                            key={user.userId}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                            style={{ backgroundColor: user.color }}
                                            title={user.userName}
                                        >
                                            {user.userName.charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                    {connectedUsers.length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium">+{connectedUsers.length - 5}</div>
                                    )}
                                </div>
                            </div>

                            {/* Share Button */}
                            {document?.ownerId._id === user?.id && (
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    <Share className="h-4 w-4 mr-2" />
                                    Share
                                </button>
                            )}

                            {/* Save Button */}
                            <button
                                onClick={saveDocument}
                                disabled={isSaving}
                                className="flex items-center px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Editor */}
            <main className="flex-1 relative">
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            onSelect={handleCursorMove}
                            onKeyUp={handleCursorMoveKeyboard}
                            onClick={handleCursorMoveMouse}
                            className="w-full min-h-screen resize-none border-none focus:outline-none text-gray-900 text-lg leading-relaxed bg-white rounded-lg shadow-sm p-8"
                            placeholder="Start writing your document..."
                            style={{ fontFamily: "Georgia, serif" }}
                        />

                        {/* Other users' cursors */}
                        {cursors.map((cursor) => {
                            if (!textareaRef.current || cursor.position < 0 || cursor.position > content.length) {
                                return null;
                            }

                            // Get accurate cursor position
                            const cursorPos = getCursorPosition(cursor.position);

                            // Get textarea styles for height
                            const textareaStyle = window.getComputedStyle(textareaRef.current);
                            const fontSize = parseFloat(textareaStyle.fontSize);
                            const lineHeight = parseFloat(textareaStyle.lineHeight) || fontSize * 1.5;

                            return (
                                <div
                                    key={cursor.userId}
                                    className="absolute pointer-events-none z-20"
                                    style={{
                                        left: `${cursorPos.left}px`,
                                        top: `${cursorPos.top}px`,
                                        transform: "translateX(-1px)",
                                    }}
                                >
                                    <div
                                        className="w-0.5 animate-pulse"
                                        style={{
                                            backgroundColor: cursor.color,
                                            height: `${lineHeight}px`,
                                        }}
                                    />
                                    <div className="absolute -top-6 -left-2 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap shadow-lg" style={{ backgroundColor: cursor.color }}>
                                        {cursor.userName}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative p-8 bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Share Document</h3>

                        <p className="text-sm text-gray-600 mb-4">Enter the email address of the person you want to share this document with.</p>

                        <input
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyPress={(e) => e.key === "Enter" && shareDocument()}
                            autoFocus
                        />

                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                onClick={shareDocument}
                                disabled={!shareEmail.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
