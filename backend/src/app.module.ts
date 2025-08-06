import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DocumentsModule } from "./documents/documents.module";
import { SocketModule } from "./socket/socket.module";
import { HealthModule } from "./health/health.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRoot(process.env.DATABASE_URL),
        AuthModule,
        UsersModule,
        DocumentsModule,
        SocketModule,
        HealthModule,
    ],
})
export class AppModule {}
