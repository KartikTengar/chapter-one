import { v4 as uuidv4 } from 'uuid';
export function createRequestIdMiddleware() {
    return async (ctx, next) => {
        const requestId = ctx.headers['x-request-id'] || uuidv4();
        ctx.set('X-Request-ID', requestId);
        ctx.state.requestId = requestId;
        await next();
    };
}
//# sourceMappingURL=request-id.js.map