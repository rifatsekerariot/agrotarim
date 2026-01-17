import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const IoTMap = ({ devices }) => {
    const navigate = useNavigate();

    // Default Center (Adana)
    // In a real app, calculate average/center of all devices
    const center = [37.0000, 35.3213];

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {devices.map(device => {
                    // Start with fixed positions for demo if lat/lng missing
                    // Spreading them out slightly for demo purposes based on ID
                    const lat = 37.0000 + (Math.random() - 0.5) * 0.1;
                    const lng = 35.3213 + (Math.random() - 0.5) * 0.1;

                    return (
                        <Marker key={device.id} position={[lat, lng]}>
                            <Popup>
                                <strong>{device.name}</strong> <br />
                                Durum: {device.status} <br />
                                <button className="btn btn-sm btn-primary mt-2" onClick={() => navigate(`/device/${device.serialNumber}`)}>
                                    Detayları Gör
                                </button>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default IoTMap;
