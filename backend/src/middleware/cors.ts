import KoaCors from '@koa/cors';
import type { Context } from 'koa';

export function createCorsMiddleware() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'https://chapter-one-xi.vercel.app'];

  return KoaCors({
    origin: (ctx: Context) => {
      const origin = ctx.header.origin;
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return '*';
      return allowedOrigins.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
}