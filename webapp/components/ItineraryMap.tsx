"use client";

import { useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { MapData } from "@/lib/planner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

type ItineraryMapProps = {
  map: MapData;
};

function averageLatLng(points: { lat: number; lng: number }[]): [number, number] {
  if (points.length === 0) return [0, 0];
  const total = points.reduce(
    (accumulator, point) => {
      accumulator.lat += point.lat;
      accumulator.lng += point.lng;
      return accumulator;
    },
    { lat: 0, lng: 0 },
  );
  return [total.lat / points.length, total.lng / points.length];
}

export default function ItineraryMap({ map }: ItineraryMapProps) {
  const center = useMemo(() => {
    const relevant = map.nodes.filter(
      (node) => node.type === "destination" || node.type === "stop",
    );
    if (relevant.length === 0) {
      return [0, 0] as [number, number];
    }
    return averageLatLng(relevant);
  }, [map.nodes]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {map.legs.map((leg) => (
        <Polyline
          key={leg.id}
          positions={[leg.from, leg.to]}
          pathOptions={{ color: leg.color, weight: 4, opacity: 0.8 }}
        >
          <Tooltip sticky>{leg.label}</Tooltip>
        </Polyline>
      ))}
      {map.nodes.map((node) => (
        <Marker key={node.id} position={[node.lat, node.lng]}>
          <Tooltip direction="top" offset={[0, -12]} opacity={0.9}>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{node.name}</p>
              {node.type === "stop" && (
                <p className="text-xs text-slate-700">
                  Day {node.day} · Stop {node.order}
                </p>
              )}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
