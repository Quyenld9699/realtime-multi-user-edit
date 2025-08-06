import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Document, DocumentDocument } from "./document.schema";

@Injectable()
export class DocumentsService {
    constructor(@InjectModel(Document.name) private documentModel: Model<DocumentDocument>) {}

    async create(title: string, ownerId: string, content: string = ""): Promise<Document> {
        const document = new this.documentModel({
            title,
            content,
            ownerId: new Types.ObjectId(ownerId),
        });
        return document.save();
    }

    async findById(id: string): Promise<DocumentDocument | null> {
        return this.documentModel.findById(id).populate("ownerId", "name email").populate("collaborators", "name email").exec();
    }

    async findByUserId(userId: string): Promise<Document[]> {
        const userObjectId = new Types.ObjectId(userId);
        return this.documentModel
            .find({
                $or: [{ ownerId: userObjectId }, { collaborators: { $in: [userObjectId] } }, { isPublic: true }],
            })
            .populate("ownerId", "name email")
            .sort({ updatedAt: -1 })
            .exec();
    }

    async updateContent(id: string, content: string): Promise<Document | null> {
        return this.documentModel.findByIdAndUpdate(id, { content }, { new: true }).exec();
    }

    async addCollaborator(documentId: string, userId: string): Promise<Document | null> {
        return this.documentModel.findByIdAndUpdate(documentId, { $addToSet: { collaborators: new Types.ObjectId(userId) } }, { new: true }).exec();
    }

    async removeCollaborator(documentId: string, userId: string): Promise<Document | null> {
        return this.documentModel.findByIdAndUpdate(documentId, { $pull: { collaborators: new Types.ObjectId(userId) } }, { new: true }).exec();
    }

    async checkAccess(documentId: string, userId: string): Promise<boolean> {
        const userObjectId = new Types.ObjectId(userId);
        const document = await this.documentModel.findById(documentId);

        if (!document) return false;

        return document.isPublic || document.ownerId.equals(userObjectId) || document.collaborators.some((collaborator) => collaborator.equals(userObjectId));
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.documentModel.findByIdAndDelete(id);
        return !!result;
    }
}
