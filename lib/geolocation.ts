/**
 * Geolocation service using ipapi.co free tier
 * Rate limit: 1,000 requests/day for free tier
 */

export interface GeolocationData {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    error?: boolean;
    errorMessage?: string;
}

/**
 * Get geolocation data from IP address using ipapi.co
 * @param ip - IP address to lookup
 * @returns Geolocation data object
 */
export async function getGeolocation(ip: string): Promise<GeolocationData> {
    // Handle localhost/private IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            latitude: 0,
            longitude: 0,
        };
    }

    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`, {
            headers: {
                'User-Agent': 'LinkHive/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if we hit rate limit
        if (data.error) {
            console.error('Geolocation API error:', data.reason);
            return {
                error: true,
                errorMessage: data.reason,
            };
        }

        return {
            country: data.country_name || 'Unknown',
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
        };
    } catch (error) {
        console.error('Error fetching geolocation:', error);
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            latitude: 0,
            longitude: 0,
            error: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Extract IP address from request headers
 * Works with x-forwarded-for, x-real-ip, and connection remote address
 */
export function getClientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    return '0.0.0.0';
}
