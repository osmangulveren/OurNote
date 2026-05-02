"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default Leaflet marker iconları SSR'sız bundling'de bozulur — kendimiz set ediyoruz.
const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -32],
  shadowSize: [41, 41],
});

export default function ShipmentMapInner({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  return (
    <MapContainer center={[lat, lng]} zoom={11} className="h-72 w-full rounded-2xl border border-slate-200 z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon}>
        {label ? <Popup>{label}</Popup> : null}
      </Marker>
    </MapContainer>
  );
}
