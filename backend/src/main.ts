import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: {
            origin: process.env.NODE_ENV === "production" ? true : [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3000", "http://127.0.0.1:3000"],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "Accept"],
        },
    });

    const configService = app.get(ConfigService);
    const port = configService.get("PORT") || 3001;

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        })
    );

    app.setGlobalPrefix("api");

    await app.listen(port, "0.0.0.0");
    console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
