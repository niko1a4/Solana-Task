import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cors from "cors";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
console.log('ENV CHECK', process.env.RPC_HTTP_URL);

