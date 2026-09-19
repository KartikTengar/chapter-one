import { ImageAnnotatorClient } from '@google-cloud/vision';

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
    const [result] = await client.documentTextDetection({
      image: { content: imageBuffer.toString('base64') },
    });

    const fullText = result.fullTextAnnotation?.text ?? '';
    if (!fullText.trim()) {
      return null;
    }

    const confidence = result.fullTextAnnotation?.pages?.[0]?.blocks?.[0]?.confidence ?? 0;

    return { text: fullText.trim(), confidence };
  } catch (e) {
    console.error('[Vision] Document text detection failed', e);
    return null;
  }
}

export function isVisionAvailable(): boolean {
  return !!getVisionClient();
}