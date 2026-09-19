import bodyParser from 'koa-bodyparser';
export function createBodyParserMiddleware() {
    return bodyParser({
        enableTypes: ['json', 'form', 'text'],
        jsonLimit: '10mb',
        formLimit: '10mb',
        textLimit: '10mb',
        strict: true,
        onerror: (err, ctx) => {
            ctx.throw(400, 'Invalid JSON payload');
        }
    });
}
//# sourceMappingURL=body-parser.js.map