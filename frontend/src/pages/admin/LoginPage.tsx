

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Layout,
  Space,
  Divider,
  Tag,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import FingerprintOutlined from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";
import schoolLogo from "../../assets/Logo SMK.png";

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  usePageTitle("Login Admin");

  const roleConfig = {
    title: "Admin Panel",
    subtitle: "Dashboard Administrator",
    icon: <SafetyOutlined />,
    color: "#2368a2",
    bgGradient: "linear-gradient(135deg, #2368a2 0%, #1a4d7a 100%)",
    redirectPath: "/admin",
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    if (token && user.role === "admin") {
      navigate("/admin");
    }
  }, [navigate]);

  interface LoginPayload {
    username: string;
    password: string;
  }

  const onFinish = async (values: LoginPayload) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      const { token, user } = response.data;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      message.success({
        content: `Selamat datang, ${user.full_name}!`,
        icon: <CheckCircleOutlined />,
        duration: 3,
      });

      if (user.role === "admin") navigate("/admin");
      else navigate("/login");
    } catch (error) {
      const errorMsg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Login Gagal!";
      message.error(errorMsg || "Login Gagal!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)`,
      }}
    >
      <Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            position: "relative",
          }}
        >
          {}
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/")}
            style={{
              position: "absolute",
              top: -30,
              left: 0,
              color: "#2368a2",
              fontWeight: 500,
            }}
          >
            Kembali ke Beranda
          </Button>

          {}
          <Card
            style={{
              borderRadius: 28,
              border: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              background: "#ffffff",
            }}
            bodyStyle={{ padding: 0 }}
          >
            {}
            <div
              style={{
                background: roleConfig.bgGradient,
                padding: "32px 32px 48px 32px",
                textAlign: "center",
                position: "relative",
              }}
            >
              {}
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  left: -40,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                }}
              />

              <img
                src={schoolLogo}
                alt="Logo Sekolah"
                style={{
                  width: 70,
                  height: 70,
                  marginBottom: 16,
                  position: "relative",
                  zIndex: 2,
                }}
              />

              <Title
                level={3}
                style={{
                  color: "#ffffff",
                  marginBottom: 8,
                  fontWeight: 600,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                SMKS Cahaya Raya
              </Title>

              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 14,
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Sistem Absensi Verifikasi Wajah
              </Text>

              <Divider
                style={{
                  margin: "20px auto 16px auto",
                  width: 60,
                  minWidth: 60,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              />

              <Tag
                icon={roleConfig.icon}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: 20,
                  padding: "4px 16px",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 500,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Login Administrator
              </Tag>
            </div>

            {}
            <div style={{ padding: "32px 32px 40px 32px" }}>
              <div style={{ marginBottom: 24 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Masukkan kredensial Anda untuk mengakses {roleConfig.title}
                </Text>
              </div>

              <Form
                form={form}
                name="login_form"
                onFinish={onFinish}
                layout="vertical"
              >
                <Form.Item
                  label={
                    <span style={{ fontWeight: 500, color: "#1a1a2e" }}>
                      Username
                    </span>
                  }
                  name="username"
                  rules={[
                    { required: true, message: "Masukkan username Anda!" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: "#2368a2" }} />}
                    placeholder="Masukkan username"
                    style={{
                      borderRadius: 12,
                      borderColor: "#e0e0e0",
                      padding: "10px 12px",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2368a2";
                      e.target.style.boxShadow =
                        "0 0 0 2px rgba(35,104,162,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ fontWeight: 500, color: "#1a1a2e" }}>
                      Password
                    </span>
                  }
                  name="password"
                  rules={[
                    { required: true, message: "Masukkan password Anda!" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: "#2368a2" }} />}
                    placeholder="Masukkan password"
                    style={{
                      borderRadius: 12,
                      borderColor: "#e0e0e0",
                      padding: "10px 12px",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2368a2";
                      e.target.style.boxShadow =
                        "0 0 0 2px rgba(35,104,162,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    icon={<LoginOutlined />}
                    style={{
                      borderRadius: 12,
                      height: 48,
                      fontSize: 16,
                      fontWeight: 600,
                      background: roleConfig.bgGradient,
                      border: "none",
                      boxShadow: `0 4px 12px ${roleConfig.color}40`,
                    }}
                  >
                    Masuk Sekarang
                  </Button>
                </Form.Item>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  <Space split={<Divider type="vertical" />}>
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 12,
                      }}
                    >
                      <FingerprintOutlined /> Verifikasi Wajah
                    </Text>
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 12,
                      }}
                    >
                      Absensi Real-time
                    </Text>
                  </Space>
                </div>
              </Form>
            </div>
          </Card>

          <div
            style={{
              textAlign: "center",
              marginTop: 24,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#888",
              }}
            >
              © 2024 SMKS Cahaya Raya | Sistem Presensi Digital
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;
