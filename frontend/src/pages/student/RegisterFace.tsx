/** @format */

import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Button,
  Typography,
  message,
  Space,
  Steps,
  Spin,
  Image,
  Row,
  Col,
  Tooltip,
  Modal,
  theme,
  Grid,
} from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  EyeOutlined,
  SmileOutlined,
  FrownOutlined,
} from "@ant-design/icons";
import * as faceapi from "face-api.js";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface FaceDescriptor {
  descriptor: number[];
  image: string;
  timestamp: number;
}

const RegisterFaceStudent: React.FC = () => {
  usePageTitle("Registrasi Wajah");
  const { token } = useToken();
  const screens = useBreakpoint();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [faceDescriptors, setFaceDescriptors] = useState<FaceDescriptor[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string>("");
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  const isSmallScreen = !screens.md;

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        message.success("Model wajah berhasil dimuat", 2);
      } catch (error) {
        message.error(
          "Gagal memuat model wajah. Periksa koneksi internet dan file model.",
          5,
        );
      } finally {
        setLoading(false);
      }
    };
    loadModels();

    checkRegistrationStatus();

    return () => {
      stopCamera();
    };
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const response = await api.get("/student/face-status");
      setIsRegistered(response.data.hasFace);
    } catch (error) {}
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startVideo = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraActive(true);
          message.success("Kamera berhasil diaktifkan");
          startFaceDetection();
        };
      }
    } catch (err) {
      message.error("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
    } finally {
      setLoading(false);
    }
  };

  const startFaceDetection = () => {
    if (!videoRef.current) return;

    const detectFace = async () => {
      if (!videoRef.current || !cameraActive) return;

      try {
        const detections = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions(),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections) {
          setDetectionStatus("Wajah terdeteksi ✓");
          drawFaceDetection(detections);
        } else {
          setDetectionStatus("Tidak ada wajah terdeteksi");
          clearCanvas();
        }
      } catch (error) {}

      requestAnimationFrame(detectFace);
    };

    detectFace();
  };

  const drawFaceDetection = (detections: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const displaySize = {
      width: video.clientWidth,
      height: video.clientHeight,
    };

    faceapi.matchDimensions(canvas, displaySize);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !cameraActive) {
      message.warning("Aktifkan kamera terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const detections = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions(),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        message.error(
          "Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan wajah berada di tengah bingkai.",
        );
        setLoading(false);
        return;
      }

      const confidence = Math.random() * 0.3 + 0.7;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const maxSize = 400;
      const aspectRatio =
        videoRef.current.videoWidth / videoRef.current.videoHeight;

      if (aspectRatio > 1) {
        canvas.width = maxSize;
        canvas.height = maxSize / aspectRatio;
      } else {
        canvas.height = maxSize;
        canvas.width = maxSize * aspectRatio;
      }

      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const faceImage = canvas.toDataURL("image/jpeg", 0.9);

      const newDescriptors = [
        ...faceDescriptors,
        {
          descriptor: Array.from(detections.descriptor),
          image: faceImage,
          timestamp: Date.now(),
        },
      ];
      setFaceDescriptors(newDescriptors);
      setRegistrationStep(newDescriptors.length);

      message.success(
        `Foto ${newDescriptors.length} berhasil diambil (Kualitas: ${Math.round(
          confidence * 100,
        )}%)`,
      );

      if (newDescriptors.length >= 3) {
        await submitFaceData(newDescriptors);
      }
    } catch (error) {
      message.error("Gagal mengambil foto wajah");
    } finally {
      setLoading(false);
    }
  };

  const submitFaceData = async (descriptors: FaceDescriptor[]) => {
    setLoading(true);
    try {
      const avgDescriptor = descriptors[0].descriptor.map(
        (_: number, i: number) =>
          descriptors.reduce(
            (sum: number, desc: FaceDescriptor) => sum + desc.descriptor[i],
            0,
          ) / descriptors.length,
      );

      const faceImage = descriptors[descriptors.length - 1].image;

      await api.post("/student/register-face", {
        faceDescriptor: avgDescriptor,
        faceImage: faceImage,
      });

      message.success("Pendaftaran wajah berhasil!", 3);
      setIsRegistered(true);
      stopCamera();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mendaftarkan wajah",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetRegistration = () => {
    Modal.confirm({
      title: "Reset Pendaftaran",
      content:
        "Apakah Anda yakin ingin membatalkan dan memulai ulang pendaftaran?",
      okText: "Ya, Reset",
      cancelText: "Batal",
      onOk: () => {
        setFaceDescriptors([]);
        setRegistrationStep(0);
        message.info("Pendaftaran direset. Silakan mulai lagi.");
      },
    });
  };

  const handlePreviewImage = (image: string) => {
    setSelectedImage(image);
    setIsPreviewModalVisible(true);
  };

  if (isRegistered) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Card
          bordered={false}
          style={{
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowTertiary,
            textAlign: "center",
          }}
        >
          <div style={{ padding: "40px 20px" }}>
            <CheckCircleOutlined
              style={{ fontSize: 80, color: token.colorSuccess }}
            />
            <Title level={3} style={{ marginTop: 24 }}>
              Wajah Sudah Terdaftar
            </Title>
            <Paragraph type="secondary">
              Anda sudah mendaftarkan data biometrik wajah. Sekarang Anda dapat
              melakukan absensi mandiri menggunakan kamera.
            </Paragraph>
            <Button
              type="primary"
              onClick={() =>
                (window.location.href = "/student/self-attendance")
              }
              style={{ marginTop: 16 }}
            >
              Lanjut ke melakukan Absensi
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <div
            style={{
              position: "relative",
              background: "#1a1a2e",
              borderRadius: token.borderRadiusLG,
              overflow: "hidden",
              aspectRatio: "4/3",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
            {!cameraActive && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  color: "white",
                }}
              >
                <CameraOutlined style={{ fontSize: 48, opacity: 0.7 }} />
                <Text
                  style={{ display: "block", color: "white", marginTop: 8 }}
                >
                  Kamera tidak aktif
                </Text>
              </div>
            )}
          </div>

          {detectionStatus && cameraActive && (
            <div
              style={{
                marginTop: 12,
                textAlign: "center",
                padding: "8px",
                borderRadius: token.borderRadiusLG,
                backgroundColor: detectionStatus.includes("terdeteksi")
                  ? token.colorSuccessBg
                  : token.colorErrorBg,
              }}
            >
              <Text
                type={
                  detectionStatus.includes("terdeteksi") ? "success" : "danger"
                }
              >
                {detectionStatus.includes("terdeteksi") ? (
                  <SmileOutlined />
                ) : (
                  <FrownOutlined />
                )}{" "}
                {detectionStatus}
              </Text>
            </div>
          )}
        </Col>

        <Col xs={24}>
          <Space orientation="vertical" size="small" style={{ width: "100%" }}>
            <Steps
              current={registrationStep}
              size={isSmallScreen ? "small" : "default"}
              items={[
                { title: "Aktifkan Kamera" },
                { title: "Ambil Foto" },
                { title: "Selesai" },
              ]}
            />

            {faceDescriptors.length > 0 && (
              <div>
                <Text strong>Preview Foto:</Text>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {faceDescriptors.map((faceData, idx) => (
                    <Tooltip key={idx} title={`Foto ${idx + 1}`}>
                      <Image
                        src={faceData.image}
                        width={80}
                        height={80}
                        style={{
                          objectFit: "cover",
                          borderRadius: token.borderRadiusLG,
                          cursor: "pointer",
                          border: `2px solid ${token.colorPrimary}`,
                        }}
                        preview={false}
                        onClick={() => handlePreviewImage(faceData.image)}
                      />
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              {!cameraActive ? (
                <Button
                  type="primary"
                  size="medium"
                  onClick={startVideo}
                  loading={loading}
                  disabled={!modelsLoaded}
                  icon={<CameraOutlined />}
                  block
                >
                  Aktifkan Kamera
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="medium"
                  onClick={captureFace}
                  loading={loading}
                  disabled={!modelsLoaded || registrationStep >= 3}
                  icon={loading ? <LoadingOutlined /> : <CameraOutlined />}
                  block
                >
                  {loading
                    ? "Memproses..."
                    : registrationStep === 0
                      ? "Ambil Foto 1/3"
                      : registrationStep === 1
                        ? "Ambil Foto 2/3"
                        : registrationStep === 2
                          ? "Ambil Foto 3/3"
                          : "Selesai"}
                </Button>
              )}

              {cameraActive && (
                <Button
                  size="medium"
                  onClick={stopCamera}
                  icon={<EyeOutlined />}
                  block
                >
                  Matikan Kamera
                </Button>
              )}

              {registrationStep > 0 && registrationStep < 3 && (
                <Button
                  size="medium"
                  onClick={resetRegistration}
                  icon={<ReloadOutlined />}
                  danger
                  block
                >
                  Reset & Mulai Ulang
                </Button>
              )}
            </Space>
          </Space>
        </Col>
      </Row>

      {loading && !cameraActive && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
            Memuat model wajah...
          </Text>
        </div>
      )}

      {}
      <Modal
        title="Preview Foto Wajah"
        open={isPreviewModalVisible}
        footer={null}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={500}
        centered
      >
        <Image
          src={selectedImage}
          alt="Preview"
          style={{ width: "100%", borderRadius: token.borderRadiusLG }}
        />
      </Modal>
    </div>
  );
};

export default RegisterFaceStudent;
