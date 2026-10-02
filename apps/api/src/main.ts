import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Limite de tamano de payload controlado (15MB) para evitar DoS por memoria
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ limit: '15mb', extended: true }));

  // 2. Cabeceras de ciberseguridad HTTP (Defense-in-depth)
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.removeHeader('X-Powered-By');
    next();
  });

  // 3. Politica de CORS restringida a origenes autorizados
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://2.24.81.205:3000',
        'http://2.24.81.205:3002',
      ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        logger.warn(`CORS BLOQUEADO: Origen no autorizado intentando conectar: ${origin}`);
        callback(new Error('Acceso no permitido por politica de seguridad CORS'), false);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 4. Swagger UI: Deshabilitado en produccion por defecto para evitar reconnaissance
  const enableSwagger = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Plataforma Kore Suite M365 API')
      .setDescription(
        'API REST y WebSockets en tiempo real para la plataforma Kore Suite. Incluye autenticacion JWT, cifrado scrypt, integracion con Microsoft 365, PostgreSQL y Redis.',
      )
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addTag('health', 'Endpoints de diagnostico y monitoreo de salud del sistema')
      .addTag('auth', 'Autenticacion y gestion de usuarios')
      .addTag('boards', 'Gestion de tableros, columnas, grupos e items')
      .addTag('automations', 'Reglas y motor de automatizaciones')
      .addTag('meetings', 'Gestion de minutas, acuerdos y reuniones de equipo')
      .addTag('microsoft-graph', 'Integracion nativa con Microsoft Outlook, Teams y SharePoint')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Kore Suite — Documentacion Oficial de API',
    });
    logger.log(`📄 Documentacion Swagger disponible en: http://localhost:${process.env.PORT || 3001}/api/docs`);
  } else {
    logger.log('🔒 Swagger UI deshabilitado en produccion por politica de endurecimiento (ENABLE_SWAGGER=false).');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 API Servidor corriendo en: http://localhost:${port}`);
}

bootstrap();
