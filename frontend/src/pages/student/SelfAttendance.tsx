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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
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
      () => message.error("Mohon aktifkan GPS untuk melakukan absensi"),
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
      } catch (error) {}
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
        `Lokasi terlalu jauh dari area absensi (${Math.round(
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
        `/student/attendance-status?date=${today}`,
      );
      if (response.data) {
        setAttendanceStatus({
          checkedIn: !!(response.data.checkedIn || response.data.checkInTime),
          checkedOut: !!(
            response.data.checkedOut || response.data.checkOutTime
          ),
          checkInTime: response.data.checkInTime,
          checkOutTime: response.data.checkOutTime,
        });
      }
    } catch (error) {
      setAttendanceStatus({ checkedIn: false, checkedOut: false });
    }
  };

  useEffect(() => {
    checkAttendanceStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAttendanceStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const pollInterval = setInterval(() => {
      checkAttendanceStatus();
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, []);

  const startVideo = () => {
    if (cameraActive) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      })
      .catch(() => {
        message.error("Gagal mengakses kamera");
      });
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const handleAttendance = async (type: "in" | "out") => {
    if (!location) {
      message.warning("Menunggu lokasi GPS...");
      return;
    }

    if (distanceMeters && distanceMeters > locationTolerance) {
      message.error("Lokasi Anda berada diluar jangkauan toleransi absensi.");
      return;
    }

    if (type === "out" && !attendanceStatus?.checkedIn) {
      message.warning("Harap absen masuk terlebih dahulu sebelum absen pulang");
      return;
    }

    setLoading(true);

    try {
      if (!videoRef.current || !modelsLoaded) {
        message.error("Kamera atau model wajah belum siap");
        setLoading(false);
        return;
      }

      const detections = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions(),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        message.error("Wajah tidak terdeteksi. Pastikan pencahayaan cukup.");
        setLoading(false);
        return;
      }

      const response = await api.post("/student/attendance", {
        faceDescriptor: Array.from(detections.descriptor),
        lat: location.lat,
        lng: location.lng,
        type: type,
      });

      if (response.data.attendanceStatus) {
        const s = response.data.attendanceStatus;
        setAttendanceStatus({
          checkedIn: !!(s.checkedIn || s.checkInTime),
          checkedOut: !!(s.checkedOut || s.checkOutTime),
          checkInTime: s.checkInTime,
          checkOutTime: s.checkOutTime,
        });
      } else {
        await checkAttendanceStatus();
      }

      message.success(
        response.data.message ||
          `Absensi ${type === "in" ? "Masuk" : "Pulang"} Berhasil!`,
      );
    } catch (err: any) {
      let errorMessage = "Gagal melakukan absensi";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (err.response?.status === 400) {
        if (errorMessage.includes("didaftarkan")) {
          errorMessage +=
            " Silakan daftar wajah terlebih dahulu di menu Daftar Wajah.";
        } else if (errorMessage.includes("sudah")) {
          errorMessage +=
            " Coba lagi besok atau hubungi guru jika ada masalah.";
        } else if (errorMessage.includes("jauh")) {
          errorMessage += " Pastikan Anda berada di area sekolah.";
        } else if (errorMessage.includes("Lokasi")) {
          errorMessage += " Aktifkan GPS dan tunggu lokasi tersedia.";
        } else if (errorMessage.includes("descriptor")) {
          errorMessage +=
            " Pastikan pencahayaan cukup dan wajah terlihat jelas di kamera.";
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
        setTimeout(() => {
          window.location.href = "/student/login";
        }, 1500);
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, []);

  return (
    <Card bordered={false} style={{ border: "none", boxShadow: "none" }}>
      {attendanceStatus && (
        <Space
          orientation="vertical"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Tag color={attendanceStatus.checkedIn ? "green" : "orange"}>
            Absen Masuk:{" "}
            {attendanceStatus.checkedIn
              ? `✓ ${attendanceStatus.checkInTime || "Sudah"}`
              : "Belum"}
          </Tag>
          <Tag color={attendanceStatus.checkedOut ? "green" : "orange"}>
            Absen Pulang:{" "}
            {attendanceStatus.checkedOut
              ? `✓ ${attendanceStatus.checkOutTime || "Sudah"}`
              : "Belum"}
          </Tag>
        </Space>
      )}

      {!attendanceStatus?.checkedOut ? (
        <Space orientation="vertical" style={{ width: "100%", marginTop: 16 }}>
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
              playsInline
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
              loading={loading}
              disabled={
                !location || !!locationError || attendanceStatus?.checkedIn
              }
              block
            >
              Absen Masuk
            </Button>

            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={() => handleAttendance("out")}
              loading={loading}
              disabled={!attendanceStatus?.checkedIn}
              block
            >
              Absen Pulang
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
                Jarak ke lokasi absensi:{" "}
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
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a" }} />
          <Title level={3}>Absensi Berhasil!</Title>
          <Text>Absensi hari ini telah selesai</Text>
          <br />
          <Space direction="vertical" style={{ marginTop: 16 }}>
            {attendanceStatus?.checkInTime && (
              <Tag color="blue">
                Absen Masuk: {attendanceStatus.checkInTime}
              </Tag>
            )}
            {attendanceStatus?.checkOutTime && (
              <Tag color="green">
                Absen Pulang: {attendanceStatus.checkOutTime}
              </Tag>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default SelfAttendance;
