import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DocumentsService } from "./documents.service";
import { DocumentsController } from "./documents.controller";
import { Document, DocumentSchema } from "./document.schema";
import { UsersModule } from "../users/users.module";

@Module({
    imports: [MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }]), UsersModule],
    controllers: [DocumentsController],
    providers: [DocumentsService],
    exports: [DocumentsService],
})
export class DocumentsModule {}
