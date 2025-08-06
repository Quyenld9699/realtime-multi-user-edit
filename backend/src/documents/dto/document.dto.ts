import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class CreateDocumentDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}

export class UpdateDocumentDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}

export class ShareDocumentDto {
    @IsString()
    @IsNotEmpty()
    email: string;
}
