import { createApp } from './app.js';
const PORT = process.env.PORT || 3001;
async function startServer() {
    const app = createApp();
    app.listen(PORT, () => {
        console.log(`🚀 CHAPTER ONE API server running on http://localhost:${PORT}`);
    });
    // Graceful shutdown
    const shutdown = async () => {
        console.log('🛑 Received shutdown signal');
        process.exit(0);
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