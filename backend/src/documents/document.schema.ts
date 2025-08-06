import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document as MongooseDocument } from "mongoose";
import { Types } from "mongoose";

export type DocumentDocument = Document & MongooseDocument;

@Schema({ timestamps: true })
export class Document {
    @Prop({ required: true })
    title: string;

    @Prop({ default: "" })
    content: string;

    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    ownerId: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
    collaborators: Types.ObjectId[];

    @Prop({ default: false })
    isPublic: boolean;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
