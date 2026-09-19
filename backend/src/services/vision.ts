import { ImageAnnotatorClient, protos } from '@google-cloud/vision';

let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient | null {
  if (visionClient) return visionClient;

  const credentialsJson = process.env.GOOGLE_VISION_CREDENTIALS_JSON;
  if (!credentialsJson) {
    console.warn('[Vision] GOOGLE_VISION_CREDENTIALS_JSON not set; Vision fallback disabled');
    return null;
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    visionClient = new ImageAnnotatorClient({ credentials });
    return visionClient;
  } catch (e) {
    console.error('[Vision] Failed to parse GOOGLE_VISION_CREDENTIALS_JSON', e);
    return null;
  }
}

export interface VisionDecodeResult {
  text: string;
  confidence: number;
}

export async function decodeQrFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<VisionDecodeResult | null> {
  const client = getVisionClient();
  if (!client) {
    return null;
  }

  try {
    // Use batchAnnotateImages with BARCODE_DETECTION feature
    // The feature type value for BARCODE_DETECTION is 16 in the Vision API
    // Use numeric value to bypass TypeScript enum limitation
    const response = await client.batchAnnotateImages({
      requests: [
        {
          image: { content: imageBuffer.toString('base64') },
          features: [{ type: 16 as protos.google.cloud.vision.v1.Feature.Type, maxResults: 10 }],
        },
      ],
    });

    const responses = (response[0] as any).responses || [];
    if (responses.length === 0) {
      return null;
    }

    const firstResponse = responses[0] as any;
    const barcodes = firstResponse.barcodeAnnotations || [];
    
    if (!barcodes || barcodes.length === 0) {
      return null;
    }

    // Find the first QR code barcode
    const qrCode = barcodes.find((b: any) => b.type === 'QR_CODE');
    const barcode = qrCode || barcodes[0];
    
    const text = barcode.rawValue || barcode.value || '';
    const confidence = barcode.confidence || 0;

    if (!text.trim()) {
      return null;
    }

    return { text: text.trim(), confidence };
  } catch (e) {
    console.error('[Vision] Barcode detection failed', e);
    return null;
  }
}

export function isVisionAvailable(): boolean {
  return !!getVisionClient();
}