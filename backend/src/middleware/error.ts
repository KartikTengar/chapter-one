import { ZodError } from 'zod';
import type { Context, Next } from 'koa';

export function createErrorMiddleware() {
  return async (ctx: Context, next: Next) => {
    try {
      await next();

      // If no body was set and status is 2xx, assume 404
      if (!ctx.body && ctx.status >= 200 && ctx.status < 300) {
        ctx.status = 404;
        ctx.body = { error: 'Not Found' };
      }
    } catch (err: unknown) {
      // Log error (will be caught by logger middleware re-throw)
      console.error('💥 Unhandled error:', err);

      // Set default error status
      const error = err as { status?: number; statusCode?: number; code?: string; message?: string; stack?: string };
      ctx.status = error.status || error.statusCode || 500;

      // Prepare error response based on environment
      const isDev = process.env.NODE_ENV === 'development';

      // Handle Zod validation errors
      if (err instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: 'Validation Failed',
          details: err.errors.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        };
        return;
      }

      // Handle known error types
      if (typeof error.code === 'string' && error.code === 'PGRST') {
        // Supabase/PostgREST errors
        ctx.status = error.status || 500;
        ctx.body = {
          error: 'Database Error',
          message: error.message,
        };
        return;
      }

      // Default error response
      ctx.body = {
        error: error.message || 'Internal Server Error',
        ...(isDev && { stack: error.stack }), // Only include stack in dev
      };
    }
  };
}