import { UAParser } from 'ua-parser-js';

export interface ParsedUserAgent {
    device: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
}

/**
 * Parse user agent string to extract device type, browser, and OS
 * @param userAgent - User agent string from request headers
 * @returns Parsed user agent data
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
    if (!userAgent) {
        return {
            device: 'desktop',
            browser: 'Unknown',
            os: 'Unknown',
        };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (result.device.type === 'mobile') {
        device = 'mobile';
    } else if (result.device.type === 'tablet') {
        device = 'tablet';
    }

    // Get browser name and version
    const browser = result.browser.name
        ? `${result.browser.name}${result.browser.version ? ' ' + result.browser.version : ''}`
        : 'Unknown';

    // Get OS name and version
    const os = result.os.name
        ? `${result.os.name}${result.os.version ? ' ' + result.os.version : ''}`
        : 'Unknown';

    return {
        device,
        browser,
        os,
    };
}

/**
 * Generate a unique visitor ID from IP and user agent
 * Used to track unique visitors across multiple clicks
 * @param ip - IP address
 * @param userAgent - User agent string
 * @returns Unique hash string
 */
export function generateVisitorId(ip: string, userAgent: string): string {
    const str = `${ip}-${userAgent}`;

    // Simple hash function (not cryptographic, just for uniqueness)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
}
