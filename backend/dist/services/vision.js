import QRCode from 'qrcode-reader';
import { Jimp } from 'jimp';
function decodeWithQrcodeReader(imageBuffer) {
    return new Promise((resolve) => {
        Jimp.read(imageBuffer)
            .then((image) => {
            const qr = new QRCode();
            qr.callback = (err, result) => {
                if (err || !result?.result) {
                    resolve(null);
                    return;
                }
                resolve({ text: result.result.trim(), confidence: 1.0 });
            };
            qr.decode(image.bitmap);
        })
            .catch(() => resolve(null));
    });
}
export async function decodeQrFromImage(imageBuffer, mimeType) {
    if (!imageBuffer || imageBuffer.length === 0) {
        return null;
    }
    if (imageBuffer.length > 10 * 1024 * 1024) {
        console.warn('[Vision] Image too large for QR decoding, skipping');
        return null;
    }
    try {
        const result = await decodeWithQrcodeReader(imageBuffer);
        if (result?.text) {
            console.log('[Vision] QR decoded successfully via qrcode-reader');
            return result;
        }
        return null;
    }
    catch (e) {
        console.error('[Vision] QR decoding failed', e);
        return null;
    }
}
export function isVisionAvailable() {
    return true;
}
//# sourceMappingURL=vision.js.map