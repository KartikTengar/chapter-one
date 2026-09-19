declare module 'qrcode-reader' {
  interface QRCodeResult {
    result: string;
  }
  
  class QRCode {
    callback: (err: Error | null, result: QRCodeResult | null) => void;
    decode: (bitmap: JimpBitmap) => void;
  }
  
  interface JimpBitmap {
    data: Buffer;
    width: number;
    height: number;
  }
  
  export = QRCode;
}
