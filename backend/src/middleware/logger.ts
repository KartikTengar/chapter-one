import pino from 'pino';
import type { Context, Next } from 'koa';

// Create a stream that writes to stdout (pino will handle formatting)
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export function createLoggerMiddleware() {
  return async (ctx: Context, next: Next) => {
    const start = Date.now();
    const requestId = ctx.state.requestId;

    // Log incoming request
    logger.info({
      requestId,
      method: ctx.method,
      url: ctx.originalUrl,
      ip: ctx.ip,
      userAgent: ctx.get('User-Agent'),
    });

    try {
      await next();

      // Log response
      const responseTime = Date.now() - start;
      logger.info({
        requestId,
        method: ctx.method,
        url: ctx.originalUrl,
        status: ctx.status,
        responseTime: `${responseTime}ms`,
        contentLength: ctx.response.length,
      });
    } catch (err: unknown) {
      // Log error
      const responseTime = Date.now() - start;
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error({
        requestId,
        method: ctx.method,
        url: ctx.originalUrl,
        error: error.message,
        stack: error.stack,
        responseTime: `${responseTime}ms`,
      });
      throw err; // re-throw for error middleware
    }
  };
}