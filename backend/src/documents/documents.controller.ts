import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { UsersService } from "../users/users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateDocumentDto, UpdateDocumentDto, ShareDocumentDto } from "./dto/document.dto";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
    constructor(
        private readonly documentsService: DocumentsService,
        private readonly usersService: UsersService
    ) {}

    @Post()
    async create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
        return this.documentsService.create(createDocumentDto.title, req.user.userId, createDocumentDto.content);
    }

    @Get()
    async findAll(@Request() req) {
        return this.documentsService.findByUserId(req.user.userId);
    }

    @Get(":id")
    async findOne(@Param("id") id: string, @Request() req) {
        const hasAccess = await this.documentsService.checkAccess(id, req.user.userId);
        if (!hasAccess) {
            throw new ForbiddenException("You do not have access to this document");
        }

        const document = await this.documentsService.findById(id);
        if (!document) {
            throw new NotFoundException("Document not found");
        }

        return document;
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() updateDocumentDto: UpdateDocumentDto, @Request() req) {
        const hasAccess = await this.documentsService.checkAccess(id, req.user.userId);
        if (!hasAccess) {
            throw new ForbiddenException("You do not have access to this document");
        }

        if (updateDocumentDto.content) {
            return this.documentsService.updateContent(id, updateDocumentDto.content);
        }

        return { message: "Document updated successfully" };
    }

    @Post(":id/share")
    async share(@Param("id") id: string, @Body() shareDocumentDto: ShareDocumentDto, @Request() req) {
        const document = await this.documentsService.findById(id);
        if (!document) {
            throw new NotFoundException("Document not found");
        }

        // Check if user is owner - handle both populated and non-populated ownerId
        const ownerIdString = typeof document.ownerId === "string" ? document.ownerId : (document.ownerId as any)._id?.toString() || document.ownerId.toString();

        if (ownerIdString !== req.user.userId) {
            throw new ForbiddenException("Only the owner can share this document");
        }

        const user = await this.usersService.findByEmail(shareDocumentDto.email);
        if (!user) {
            throw new BadRequestException("User not found");
        }

        return this.documentsService.addCollaborator(id, (user as any)._id.toString());
    }

    @Delete(":id")
    async remove(@Param("id") id: string, @Request() req) {
        const document = await this.documentsService.findById(id);
        if (!document) {
            throw new NotFoundException("Document not found");
        }

        // Check if user is owner
        if (document.ownerId.toString() !== req.user.userId) {
            throw new ForbiddenException("Only the owner can delete this document");
        }

        const deleted = await this.documentsService.delete(id);
        if (!deleted) {
            throw new BadRequestException("Failed to delete document");
        }

        return { message: "Document deleted successfully" };
    }
}
