"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl =
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface ClickLocation {
    lat: number;
    lng: number;
    count: number;
    city?: string;
    country?: string;
}

interface GeospatialMapProps {
    clicks: ClickLocation[];
    height?: string;
    className?: string;
}

export default function GeospatialMap({ clicks, height = "400px", className = "" }: GeospatialMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="h-[400px] w-full rounded-xl bg-gray-900/50 flex items-center justify-center text-gray-400">
                Loading map...
            </div>
        );
    }

    // Default center (London) if no clicks
    const center: [number, number] =
        clicks.length > 0 ? [clicks[0].lat, clicks[0].lng] : [51.505, -0.09];

    return (
        <div className={`w-full rounded-xl overflow-hidden border border-gray-800 z-0 relative ${className}`} style={{ height }}>
            <MapContainer
                center={center}
                zoom={2}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {clicks.map((click, index) => (
                    <Marker
                        key={index}
                        position={[click.lat, click.lng]}
                        icon={customIcon}
                    >
                        <Popup>
                            <div className="text-sm">
                                <p className="font-bold">
                                    {click.city}, {click.country}
                                </p>
                                <p>{click.count} clicks</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
