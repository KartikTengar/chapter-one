import { createApp } from './app.js';
import { createServer } from 'node:http';
const PORT = Number(process.env.PORT || 3001);
async function startServer() {
    const app = createApp();
    const server = createServer(app.callback());
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 CHAPTER ONE API server running on http://localhost:${PORT}`);
    });
    // Graceful shutdown
    const shutdown = async () => {
        console.log('🛑 Received shutdown signal');
        server.close(() => {
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
// Start server if not imported as module
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer().catch(err => {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    });
}
export { createApp };
//# sourceMappingURL=index.js.map