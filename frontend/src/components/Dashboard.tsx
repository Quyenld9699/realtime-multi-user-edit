"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { documentsApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, FileText, Share, Trash2, LogOut, User } from "lucide-react";

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

export default function Dashboard() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState("");
    const [error, setError] = useState("");

    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const docs = (await documentsApi.getAll()) as Document[];
            setDocuments(docs);
        } catch (error: any) {
            setError(error.message || "Failed to load documents");
        } finally {
            setIsLoading(false);
        }
    };

    const createDocument = async () => {
        if (!newDocTitle.trim()) return;

        try {
            const newDoc = (await documentsApi.create(newDocTitle.trim())) as Document;
            setDocuments([newDoc, ...documents]);
            setNewDocTitle("");
            setShowCreateModal(false);
            router.push(`/editor/${newDoc._id}`);
        } catch (error: any) {
            setError(error.message || "Failed to create document");
        }
    };

    const deleteDocument = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;

        try {
            await documentsApi.delete(id);
            setDocuments(documents.filter((doc) => doc._id !== id));
        } catch (error: any) {
            setError(error.message || "Failed to delete document");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <FileText className="h-8 w-8 text-indigo-600 mr-3" />
                            <h1 className="text-2xl font-bold text-gray-900">Real-time Documents</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm text-gray-700">
                                <User className="h-4 w-4 mr-1" />
                                {user?.name}
                            </div>
                            <button onClick={logout} className="flex items-center text-sm text-gray-700 hover:text-gray-900">
                                <LogOut className="h-4 w-4 mr-1" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Create Document Button */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium text-gray-900">Your Documents</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Document
                        </button>
                    </div>

                    {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

                    {/* Documents Grid */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-gray-500">Loading documents...</div>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new document.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc._id}
                                    className="relative group bg-white rounded-lg border border-gray-300 p-6 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => router.push(`/editor/${doc._id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-medium text-gray-900 truncate">{doc.title}</h3>
                                            <p className="mt-2 text-sm text-gray-500 line-clamp-3">{doc.content.substring(0, 150)}...</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <span>Updated {formatDate(doc.updatedAt)}</span>
                                        </div>

                                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {doc.ownerId._id === user?.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteDocument(doc._id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {doc.collaborators.length > 0 && (
                                        <div className="mt-2 flex items-center text-xs text-gray-500">
                                            <Share className="h-3 w-3 mr-1" />
                                            Shared with {doc.collaborators.length} user(s)
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Document Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative p-8 bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Document</h3>

                        <input
                            type="text"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            placeholder="Document title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyPress={(e) => e.key === "Enter" && createDocument()}
                            autoFocus
                        />

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createDocument}
                                disabled={!newDocTitle.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
