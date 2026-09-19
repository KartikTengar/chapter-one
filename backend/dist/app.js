import Koa from 'koa';
import { createRequestIdMiddleware } from './middleware/request-id.js';
import { createLoggerMiddleware } from './middleware/logger.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { createHelmetMiddleware } from './middleware/helmet.js';
import { createBodyParserMiddleware } from './middleware/body-parser.js';
import { createRateLimitMiddleware } from './middleware/rate-limit.js';
import { createErrorMiddleware } from './middleware/error.js';
import { eventsRouter } from './controllers/events.js';
import { dashboardRouter } from './controllers/dashboard.js';
import { gamesRouter } from './controllers/games.js';
import { leaderboardRouter } from './controllers/leaderboard.js';
import { trailRouter } from './controllers/trail.js';
import { photoRouter } from './controllers/photos.js';
import { galleryRouter } from './controllers/gallery.js';
import { adminRouter } from './controllers/admin.js';
export function createApp() {
    const app = new Koa();
    // Middleware stack (order matters)
    app.use(createRequestIdMiddleware());
    app.use(createLoggerMiddleware());
    app.use(createCorsMiddleware());
    app.use(createHelmetMiddleware());
    app.use(createBodyParserMiddleware());
    app.use(createRateLimitMiddleware());
    // Health check endpoint
    app.use(async (ctx, next) => {
        if (ctx.path === '/health' && ctx.method === 'GET') {
            ctx.status = 200;
            ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
            return;
        }
        await next();
    });
    // API routes
    app.use(eventsRouter.routes());
    app.use(eventsRouter.allowedMethods());
    app.use(dashboardRouter.routes());
    app.use(dashboardRouter.allowedMethods());
    app.use(gamesRouter.routes());
    app.use(gamesRouter.allowedMethods());
    app.use(leaderboardRouter.routes());
    app.use(leaderboardRouter.allowedMethods());
    app.use(trailRouter.routes());
    app.use(trailRouter.allowedMethods());
    app.use(photoRouter.routes());
    app.use(photoRouter.allowedMethods());
    app.use(galleryRouter.routes());
    app.use(galleryRouter.allowedMethods());
    app.use(adminRouter.routes());
    app.use(adminRouter.allowedMethods());
    // Error handling (must be last)
    app.use(createErrorMiddleware());
    return app;
}
//# sourceMappingURL=app.js.map