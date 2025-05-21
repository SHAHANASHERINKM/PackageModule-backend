import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  // Serve static files from the "uploads" folder
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // Files accessible at http://localhost:3000/uploads/{filename}
  });
app.useGlobalPipes(new ValidationPipe({ transform: true }));

 

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
