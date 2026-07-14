/** @format */

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { LatLng, Icon } from "leaflet";
import {
  Space,
  Typography,
  Button,
  Input,
  Row,
  Col,
  Card,
  message,
} from "antd";
import "leaflet/dist/leaflet.css";

const { Text } = Typography;

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapClickHandler: React.FC<{
  onLocationChange: (lat: number, lng: number) => void;
}> = ({ onLocationChange }) => {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapPanner: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
}) => {
  const [tempLat, setTempLat] = useState(latitude.toString());
  const [tempLng, setTempLng] = useState(longitude.toString());
  const [markerPosition, setMarkerPosition] = useState<LatLng>(
    new LatLng(latitude, longitude),
  );

  const handleLocationChange = (lat: number, lng: number) => {
    setMarkerPosition(new LatLng(lat, lng));
    setTempLat(lat.toString());
    setTempLng(lng.toString());
    onLocationChange(lat, lng);
  };

  const handleSetFromInput = () => {
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);

    if (isNaN(lat) || isNaN(lng)) {
      message.error(
        "Koordinat tidak valid. Gunakan format desimal (contoh: -6.27)",
      );
      return;
    }

    if (lat < -90 || lat > 90) {
      message.error("Latitude harus antara -90 dan 90");
      return;
    }

    if (lng < -180 || lng > 180) {
      message.error("Longitude harus antara -180 dan 180");
      return;
    }

    handleLocationChange(lat, lng);
    message.success("Koordinat diperbarui");
  };

  return (
    <Space orientation="vertical" style={{ width: "100%" }} size="large">
      {/* Info Box */}
      <Card
        size="small"
        style={{
          backgroundColor: "rgba(24, 144, 255, 0.05)",
          border: "1px solid rgba(24, 144, 255, 0.2)",
        }}
      >
        <Space orientation="vertical" size={0}>
          <Text strong>Cara menggunakan:</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Klik pada peta untuk mengatur lokasi absensi, atau masukkan
            koordinat secara manual di bawah.
          </Text>
        </Space>
      </Card>

      {/* Map Container */}
      <div
        style={{
          height: "400px",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={18}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={markerPosition} icon={markerIcon}>
            <Popup>
              <div>
                <Text strong>Lokasi Absensi</Text>
                <br />
                <Text
                  code
                >{`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}</Text>
              </div>
            </Popup>
          </Marker>
          <MapClickHandler onLocationChange={handleLocationChange} />
          <MapPanner center={markerPosition} />
        </MapContainer>
      </div>

      {/* Manual Input */}
      <Card size="small" title="Masukkan Koordinat Manual">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Latitude
            </Text>
            <Input
              type="number"
              step="0.00000001"
              placeholder="-6.274207"
              value={tempLat}
              onChange={(e) => setTempLat(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Longitude
            </Text>
            <Input
              type="number"
              step="0.00000001"
              placeholder="107.650786"
              value={tempLng}
              onChange={(e) => setTempLng(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </Col>
        </Row>
        <Button
          type="primary"
          onClick={handleSetFromInput}
          style={{ marginTop: 12, width: "100%" }}
        >
          Terapkan Koordinat
        </Button>
      </Card>

      {/* Info Text */}
      <Text type="secondary" style={{ fontSize: 12 }}>
        💡 Tip: Gunakan Google Maps atau aplikasi peta lain untuk menemukan
        koordinat lokasi yang tepat.
      </Text>
    </Space>
  );
};

export default LocationPicker;
