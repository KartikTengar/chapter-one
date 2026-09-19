import bodyParser from 'koa-bodyparser';
import type { Context } from 'koa';

export function createBodyParserMiddleware() {
  return bodyParser({
    enableTypes: ['json', 'form', 'text'],
    jsonLimit: '10mb',
    formLimit: '10mb',
    textLimit: '10mb',
    strict: true,
    onerror: (err: unknown, ctx: Context) => {
      ctx.throw(400, 'Invalid JSON payload');
    }
  });
}