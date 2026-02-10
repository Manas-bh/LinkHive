import QRCode from 'qrcode';

/**
 * Generate QR code as base64 data URL
 * @param text - Text to encode (usually the short URL)
 * @param options - QR code options
 * @returns Promise resolving to base64 data URL
 */
export async function generateQRCode(
    text: string,
    options?: {
        width?: number;
        margin?: number;
        color?: {
            dark?: string;
            light?: string;
        };
    }
): Promise<string> {
    try {
        const qrOptions = {
            width: options?.width || 300,
            margin: options?.margin || 2,
            color: {
                dark: options?.color?.dark || '#000000',
                light: options?.color?.light || '#FFFFFF',
            },
        };

        return await QRCode.toDataURL(text, qrOptions);
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate QR code as SVG string
 * @param text - Text to encode
 * @returns Promise resolving to SVG string
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
    try {
        return await QRCode.toString(text, { type: 'svg' });
    } catch (error) {
        console.error('Error generating QR code SVG:', error);
        throw new Error('Failed to generate QR code SVG');
    }
}
