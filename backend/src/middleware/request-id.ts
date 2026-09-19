import { v4 as uuidv4 } from 'uuid';
import type { Context, Next } from 'koa';

export function createRequestIdMiddleware() {
  return async (ctx: Context, next: Next) => {
    const requestId = ctx.headers['x-request-id'] || uuidv4();
    ctx.set('X-Request-ID', requestId);
    ctx.state.requestId = requestId;
    await next();
  };
}