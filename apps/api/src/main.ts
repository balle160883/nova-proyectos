import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit to 50MB for uploading base64 profile pictures and attachments
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Plataforma Kore Suite M365 API')
    .setDescription(
      'API REST y WebSockets en tiempo real para la plataforma Kore Suite. Incluye autenticación JWT, cifrado scrypt, integración con Microsoft 365 (Graph API & Entra ID), PostgreSQL y Redis.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('health', 'Endpoints de diagnóstico y monitoreo de salud del sistema')
    .addTag('auth', 'Autenticación, inicio de sesión SSO Entra ID y gestión de usuarios')
    .addTag('boards', 'Gestión de tableros, columnas, grupos e ítems')
    .addTag('automations', 'Reglas y motor de automatizaciones')
    .addTag('meetings', 'Gestión de minutas, acuerdos y reuniones de equipo')
    .addTag('microsoft-graph', 'Integración nativa con Microsoft Outlook, Teams y SharePoint')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Kore Suite — Documentación Oficial de API',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 API Servidor corriendo en: http://localhost:${port}`);
  logger.log(`📄 Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
