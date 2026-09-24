/** @format */

import React, { useEffect, useRef, useState } from "react";
import { Card, Button, Typography, message, Space, Tag, Alert } from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import * as faceapi from "face-api.js";
import api from "../../api/instance";
import dayjs from "dayjs";
import { usePageTitle } from "../../utils/usePageTitle";

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const getDistanceInMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const { Title, Text } = Typography;

const SelfAttendance: React.FC = () => {
  usePageTitle("Presensi Mandiri");

  const checkAuthAndToken = () => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      message.error("Sesi Anda telah berakhir. Silakan login kembali.");

      window.location.href = "/teacher/login";
      return false;
    }
    return true;
  };

  useEffect(() => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
      message.error("Sesi Anda telah berakhir. Silakan login kembali.");
      setTimeout(() => {
        window.location.href = "/teacher/login";
      }, 1000);
    }
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState<"in" | "out" | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [attendanceStatus, setAttendanceStatus] = useState<{
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  } | null>(null);
  const [locationTolerance, setLocationTolerance] = useState<number>(100);
  const [schoolLocation, setSchoolLocation] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: -6.2744207,
    lng: 107.6503034,
  });
  const [, setAttendanceStartTime] = useState<string>("06:30");
  const [, setAttendanceEndTime] = useState<string>("13:00");
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        message.success("Model wajah berhasil dimuat");
      } catch (error) {
        message.error(
          "Gagal memuat model wajah. Periksa koneksi internet dan file model.",
        );
      }
    };
    loadModels();

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => message.error("Mohon aktifkan GPS untuk melakukan presensi"),
    );
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get("/settings");

        setLocationTolerance(response.data.toleranceMeters ?? 100);
        setSchoolLocation({
          lat: response.data.attendanceLocationLat ?? -6.2744207,
          lng: response.data.attendanceLocationLng ?? 107.6503034,
        });
        setAttendanceStartTime(response.data.attendanceStartTime ?? "06:30");
        setAttendanceEndTime(response.data.attendanceEndTime ?? "13:00");
      } catch (error: any) {
        if (error.response?.status === 401) {
          sessionStorage.removeItem("token");
          localStorage.removeItem("token");
        } else {
        }
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (!location) {
      setDistanceMeters(null);
      setLocationError(null);
      return;
    }

    const meters = getDistanceInMeters(
      location.lat,
      location.lng,
      schoolLocation.lat,
      schoolLocation.lng,
    );
    setDistanceMeters(meters);

    if (meters > locationTolerance) {
      setLocationError(
        `Lokasi terlalu jauh dari area presensi (${Math.round(
          meters,
        )} m). Batas toleransi ${locationTolerance} m.`,
      );
    } else {
      setLocationError(null);
    }
  }, [location, locationTolerance, schoolLocation]);

  const checkAttendanceStatus = async () => {
    try {
      const today = dayjs().format("YYYY-MM-DD");

      const response = await api.get(
        `/teacher/attendance-status?date=${today}`,
      );
      setAttendanceStatus(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
      } else if (
        error.response?.status === 404 ||
        error.message === "Network Error"
      ) {
        setAttendanceStatus({ checkedIn: false, checkedOut: false });
      } else {
        setAttendanceStatus({ checkedIn: false, checkedOut: false });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAttendanceStatus();
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAttendanceStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const pollInterval = setInterval(() => {
      checkAttendanceStatus();
    }, 60000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  };

  const handleAttendance = async (type: "in" | "out") => {
    const tokenCheck = checkAuthAndToken();

    if (!tokenCheck) {
      return;
    }

    if (!location) {
      return message.warning("Menunggu lokasi GPS...");
    }

    if (distanceMeters && distanceMeters > locationTolerance) {
      return message.error(
        "Lokasi Anda berada diluar jangkauan toleransi presensi.",
      );
    }

    setLoading(type);

    try {
      const detections = await faceapi
        .detectSingleFace(
          videoRef.current!,
          new faceapi.TinyFaceDetectorOptions(),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        message.error("Wajah tidak terdeteksi. Pastikan pencahayaan cukup.");
        setLoading(null);
        return;
      }

      const response = await api.post("/teacher/attendance", {
        faceDescriptor: Array.from(detections.descriptor),
        lat: location.lat,
        lng: location.lng,
        type: type,
      });

      if (response.data.attendanceStatus) {
        setAttendanceStatus(response.data.attendanceStatus);
      } else {
        void checkAttendanceStatus();
      }

      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      message.success(
        response.data.message ||
          `Presensi ${type === "in" ? "Masuk" : "Pulang"} Berhasil!`,
      );
    } catch (err: any) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        message.error("Sesi Anda telah berakhir. Silakan login kembali.");
        setTimeout(() => {
          window.location.href = "/teacher/login";
        }, 1500);
      } else if (err.response?.status === 400 || err.response?.status === 422) {
        message.error(err.response?.data?.message || "Gagal verifikasi wajah");
      } else {
        message.error(err.response?.data?.message || "Gagal verifikasi wajah");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card bordered={false} style={{ border: "none", boxShadow: "none" }}>
      {attendanceStatus && (
        <Space
          orientation="vertical"
          style={{ width: "100%", marginBottom: 16, textAlign: "center" }}
        >
          <Tag color={attendanceStatus.checkedIn ? "green" : "orange"}>
            Presensi Masuk:{" "}
            {attendanceStatus.checkedIn
              ? `✓ ${attendanceStatus.checkInTime}`
              : "Belum"}
          </Tag>
          <Tag color={attendanceStatus.checkedOut ? "green" : "orange"}>
            Presensi Pulang:{" "}
            {attendanceStatus.checkedOut
              ? `✓ ${attendanceStatus.checkOutTime}`
              : "Belum"}
          </Tag>
        </Space>
      )}

      {!attendanceStatus?.checkedOut ? (
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Alert
            title="Pastikan wajah berada di dalam bingkai kamera dan GPS aktif."
            type="info"
            showIcon
          />
          {locationError && (
            <Alert
              title={locationError}
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
            />
          )}

          <div
            style={{
              position: "relative",
              background: "#000",
              borderRadius: 8,
              overflow: "hidden",
              width: "100%",
              maxWidth: "200px",
              aspectRatio: "1",
              margin: "0 auto",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              width="100%"
              height="100%"
              style={{ objectFit: "cover" }}
            />
          </div>

          <Space
            orientation="vertical"
            style={{ width: "100%", textAlign: "center" }}
          >
            <Button
              icon={<CameraOutlined />}
              onClick={startVideo}
              disabled={!modelsLoaded}
            >
              Aktifkan Kamera
            </Button>
          </Space>

          {}
          <Space
            orientation="horizontal"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => handleAttendance("in")}
              loading={loading === "in"}
              disabled={
                !location || !!locationError || attendanceStatus?.checkedIn
              }
              block
            >
              Presensi Masuk
            </Button>

            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={() => handleAttendance("out")}
              loading={loading === "out"}
              disabled={!attendanceStatus?.checkedIn}
              block
            >
              Presensi Pulang
            </Button>
          </Space>

          {location && (
            <div>
              <Text type="secondary">
                Lokasi Terdeteksi: {location.lat.toFixed(4)},{" "}
                {location.lng.toFixed(4)}
              </Text>
              <br />
              <Text type="secondary">
                Jarak ke lokasi presensi:{" "}
                {distanceMeters !== null
                  ? `${Math.round(distanceMeters)} m`
                  : "-"}
              </Text>
              <br />
              <Text type="secondary">
                Toleransi jarak: {locationTolerance} m
              </Text>
            </div>
          )}
        </Space>
      ) : (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a" }} />
          <Title level={3}>Terima Kasih, Bapak/Ibu Guru</Title>
          <Text>Presensi hari ini telah selesai</Text>
          <br />
          <Space orientation="vertical" style={{ marginTop: 16 }}>
            {attendanceStatus?.checkInTime && (
              <Tag color="blue">
                Presensi Masuk: {attendanceStatus.checkInTime}
              </Tag>
            )}
            {attendanceStatus?.checkOutTime && (
              <Tag color="green">
                Presensi Pulang: {attendanceStatus.checkOutTime}
              </Tag>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default SelfAttendance;
