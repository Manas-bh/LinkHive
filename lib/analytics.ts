import { IClickDetail } from '@/model/urlModel';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface ClicksByDay {
    date: string;
    clicks: number;
}

export interface Breakdown {
    name: string;
    value: number;
}

export interface GeoBreakdown {
    country: string;
    city: string;
    count: number;
}

export interface ClickCoordinate {
    lat: number;
    lng: number;
    count: number;
    city?: string;
    country?: string;
}

/**
 * Aggregate clicks by day for time-series charts
 */
export function aggregateClicksByDay(
    clicks: IClickDetail[],
    days: number = 30
): ClicksByDay[] {
    const result: Map<string, number> = new Map();

    // Initialize with last N days
    for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        result.set(date, 0);
    }

    // Count clicks per day
    clicks.forEach(click => {
        if (click.timestamp) {
            const date = format(new Date(click.timestamp), 'yyyy-MM-dd');
            if (result.has(date)) {
                result.set(date, (result.get(date) || 0) + 1);
            }
        }
    });

    return Array.from(result.entries()).map(([date, clicks]) => ({
        date,
        clicks,
    }));
}

/**
 * Aggregate clicks by device type
 */
export function aggregateByDevice(clicks: IClickDetail[]): Breakdown[] {
    const deviceMap: Map<string, number> = new Map();

    clicks.forEach(click => {
        const device = click.device || 'Unknown';
        deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    return Array.from(deviceMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

/**
 * Aggregate clicks by browser
 */
export function aggregateByBrowser(clicks: IClickDetail[]): Breakdown[] {
    const browserMap: Map<string, number> = new Map();

    clicks.forEach(click => {
        const browser = click.browser || 'Unknown';
        // Simplify browser name (remove version)
        const simpleName = browser.split(' ')[0];
        browserMap.set(simpleName, (browserMap.get(simpleName) || 0) + 1);
    });

    return Array.from(browserMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

/**
 * Aggregate clicks by operating system
 */
export function aggregateByOS(clicks: IClickDetail[]): Breakdown[] {
    const osMap: Map<string, number> = new Map();

    clicks.forEach(click => {
        const os = click.os || 'Unknown';
        // Simplify OS name (remove version)
        const simpleName = os.split(' ')[0];
        osMap.set(simpleName, (osMap.get(simpleName) || 0) + 1);
    });

    return Array.from(osMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

/**
 * Aggregate clicks by country and city
 */
export function aggregateByGeo(clicks: IClickDetail[]): GeoBreakdown[] {
    const geoMap: Map<string, number> = new Map();

    clicks.forEach(click => {
        const country = click.country || 'Unknown';
        const city = click.city || 'Unknown';
        const key = `${country}|${city}`;
        geoMap.set(key, (geoMap.get(key) || 0) + 1);
    });

    return Array.from(geoMap.entries())
        .map(([key, count]) => {
            const [country, city] = key.split('|');
            return { country, city, count };
        })
        .sort((a, b) => b.count - a.count);
}

/**
 * Get click coordinates for map visualization
 */
export function getClickCoordinates(clicks: IClickDetail[]): ClickCoordinate[] {
    const coordMap: Map<string, ClickCoordinate> = new Map();

    clicks.forEach(click => {
        if (click.latitude && click.longitude) {
            const key = `${click.latitude},${click.longitude}`;
            if (coordMap.has(key)) {
                const existing = coordMap.get(key)!;
                existing.count += 1;
            } else {
                coordMap.set(key, {
                    lat: click.latitude,
                    lng: click.longitude,
                    count: 1,
                    city: click.city,
                    country: click.country,
                });
            }
        }
    });

    return Array.from(coordMap.values());
}

/**
 * Calculate unique visitors from click details
 */
export function calculateUniqueVisitors(clicks: IClickDetail[]): number {
    const uniqueIds = new Set<string>();

    clicks.forEach(click => {
        if (click.uniqueId) {
            uniqueIds.add(click.uniqueId);
        }
    });

    return uniqueIds.size;
}

/**
 * Filter clicks by date range
 */
export function filterClicksByDateRange(
    clicks: IClickDetail[],
    startDate: Date,
    endDate: Date
): IClickDetail[] {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    return clicks.filter(click => {
        if (!click.timestamp) return false;
        const clickDate = new Date(click.timestamp);
        return clickDate >= start && clickDate <= end;
    });
}

/**
 * Get top N items from breakdown
 */
export function getTopN(breakdown: Breakdown[], n: number = 10): Breakdown[] {
    return breakdown.slice(0, n);
}
