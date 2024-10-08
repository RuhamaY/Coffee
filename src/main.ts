import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WrapResponseInterceptor } from './common/interceptors/wrap-response.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    }));
    app.useGlobalInterceptors(new WrapResponseInterceptor(), new TimeoutInterceptor());

    const options = new DocumentBuilder()
      .setTitle('coffee')
      .setDescription('coffee application')
      .setVersion('1.0')
      .build();
    
      const document = SwaggerModule.createDocument(app, options);
      SwaggerModule.setup('api' , app, document);

  await app.listen(3000);
}
bootstrap();
