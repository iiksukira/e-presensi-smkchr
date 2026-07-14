/** @format */

import React, { useState } from "react";
import {
  Button,
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Divider,
  Space,
  Badge,
  Select,
  Form,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  HeartOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import schoolLogo from "../assets/Logo SMK.png";

const { Title, Text, Paragraph } = Typography;
const { Content, Footer } = Layout;
const { Option } = Select;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [isHovered, setIsHovered] = useState(false);

  const handleLogin = () => {
    const loginPaths: { [key: string]: string } = {
      admin: "/admin/login",
      guru: "/teacher/login",
      siswa: "/student/login",
      "orang tua": "/parent/login",
    };
    navigate(loginPaths[selectedRole] || "/login");
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: "#2368a2",
      guru: "#8c9600",
      siswa: "#7dba00",
      "orang tua": "#910000",
    };
    return colors[role] || "#2368a2";
  };

  const getRoleIcon = (role: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      admin: <UserOutlined />,
      guru: <TeamOutlined />,
      siswa: <BookOutlined />,
      "orang tua": <HeartOutlined />,
    };
    return icons[role] || <UserOutlined />;
  };

  const cardStyle: React.CSSProperties = {
    textAlign: "center",
    borderRadius: 20,
    border: "none",
    background: "#ffffff",
    boxShadow: isHovered
      ? "0 20px 40px rgba(0, 0, 0, 0.15)"
      : "0 10px 30px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
    padding: "30px 20px",
    maxWidth: 400,
    margin: "0 auto",
  };

  const buttonStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color,
    borderColor: color,
    borderRadius: 12,
    height: 40,
    fontSize: 16,
    fontWeight: 600,
    color: "#ffffff",
    width: "100%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
  });

  const selectStyle = (): React.CSSProperties => ({
    width: "100%",
    height: 40,
    borderRadius: 12,
  });

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "#ffffff",
      }}
    >
      <Content>
        {/* Hero Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #2368a2 0%, #1a4d7a 100%)",
            padding: "60px 20px 100px 20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative elements */}
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(125, 186, 0, 0.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -80,
              left: -80,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "rgba(125, 186, 0, 0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(125,186,0,0.05) 0%, rgba(125,186,0,0) 70%)",
            }}
          />

          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              textAlign: "center",
              position: "relative",
              zIndex: 2,
            }}
          >
            <img
              src={schoolLogo}
              alt="Logo SMK"
              style={{
                width: 100,
                height: 100,
                marginBottom: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            />

            <Title
              level={1}
              style={{
                color: "#ffffff",
                fontWeight: 650,
                marginBottom: 16,
                fontSize: "1.5rem",
              }}
            >
              Presensi SMKS Cahaya Raya
            </Title>

            <Paragraph
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "1.1rem",
                maxWidth: 600,
                margin: "0 auto 32px auto",
              }}
            >
              Solusi cerdas untuk mengelola kehadiran siswa, guru, dan staf
              sekolah.
            </Paragraph>

            <Space size="middle" wrap align="center">
              <Badge dot style={{ color: "#7dba00" }} offset={[10, 0]}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    padding: "8px 16px",
                  }}
                >
                  <Text style={{ color: "#ffffff" }}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Real-time Monitoring
                  </Text>
                </div>
              </Badge>
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: "8px 16px",
                }}
              >
                <Text style={{ color: "#ffffff" }}>
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  Akurasi 100%
                </Text>
              </div>
            </Space>
          </div>
        </div>

        {/* Login Section - Redesigned with ComboBox */}
        <div
          style={{
            maxWidth: 550,
            margin: "-60px auto 0 auto",
            padding: "0 20px 60px 20px",
            position: "relative",
            zIndex: 3,
          }}
        >
          <Card
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Role Icon */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `${getRoleColor(selectedRole)}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px auto",
                fontSize: "2rem",
                color: getRoleColor(selectedRole),
                transition: "all 0.3s ease",
              }}
            >
              {React.cloneElement(
                getRoleIcon(selectedRole) as React.ReactElement<any>,
                {
                  style: { fontSize: "2.5rem" },
                } as any,
              )}
            </div>

            <Title
              level={3}
              style={{
                color: getRoleColor(selectedRole),
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Selamat Datang
            </Title>

            <Text
              type="secondary"
              style={{
                display: "block",
                marginBottom: 20,
                fontSize: "0.85rem",
              }}
            >
              Silakan pilih peran Anda untuk melanjutkan
            </Text>

            <Form layout="vertical" style={{ width: "100%" }}>
              <Form.Item
                label={
                  <Text strong style={{ fontSize: 14 }}>
                    Login Sebagai
                  </Text>
                }
                style={{ marginBottom: 20 }}
              >
                <Select
                  value={selectedRole}
                  onChange={handleRoleChange}
                  style={selectStyle()}
                  size="small"
                  suffixIcon={<UserOutlined />}
                  popupMatchSelectWidth={false}
                >
                  <Option value="admin">
                    <Space>
                      <UserOutlined style={{ color: "#2368a2" }} />
                      <span>Admin</span>
                    </Space>
                  </Option>
                  <Option value="guru">
                    <Space>
                      <TeamOutlined style={{ color: "#8c9600" }} />
                      <span>Guru</span>
                    </Space>
                  </Option>
                  <Option value="siswa">
                    <Space>
                      <BookOutlined style={{ color: "#7dba00" }} />
                      <span>Siswa</span>
                    </Space>
                  </Option>
                  <Option value="orang tua">
                    <Space>
                      <HeartOutlined style={{ color: "#910000" }} />
                      <span>Orang Tua</span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Button
                type="primary"
                size="medium"
                style={buttonStyle(getRoleColor(selectedRole))}
                onClick={handleLogin}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Login sebagai{" "}
                {selectedRole === "orang tua"
                  ? "Orang Tua"
                  : selectedRole.charAt(0).toUpperCase() +
                    selectedRole.slice(1)}
                <ArrowRightOutlined style={{ marginLeft: 8 }} />
              </Button>
            </Form>
          </Card>
        </div>

        {/* Features Highlight */}
        <div
          style={{
            background: "#f8fafc",
            padding: "60px 20px",
            borderTop: "1px solid #eef2f6",
          }}
        >
          <div
            style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}
          >
            <Title level={3} style={{ color: "#2368a2", marginBottom: 16 }}>
              Mengapa Memilih Sistem Presensi Kami?
            </Title>
            <Paragraph
              style={{
                color: "#666",
                maxWidth: 700,
                margin: "0 auto 48px auto",
              }}
            >
              Dilengkapi dengan fitur modern untuk mendukung kegiatan belajar
              mengajar yang lebih efektif
            </Paragraph>

            <Row gutter={[32, 32]}>
              <Col xs={24} md={8}>
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "#e8f0f8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px auto",
                      color: "#2368a2",
                      fontSize: "1.5rem",
                    }}
                  >
                    <ClockCircleOutlined />
                  </div>
                  <Title level={5} style={{ color: "#2368a2" }}>
                    Real-time
                  </Title>
                  <Text type="secondary">
                    Data kehadiran terupdate secara langsung dan akurat
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "#f0f7e6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px auto",
                      color: "#7dba00",
                      fontSize: "1.5rem",
                    }}
                  >
                    <SafetyOutlined />
                  </div>
                  <Title level={5} style={{ color: "#7dba00" }}>
                    Aman & Terpercaya
                  </Title>
                  <Text type="secondary">
                    Sistem keamanan berlapis untuk melindungi data
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "#e8f0f8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px auto",
                      color: "#2368a2",
                      fontSize: "1.5rem",
                    }}
                  >
                    <TeamOutlined />
                  </div>
                  <Title level={5} style={{ color: "#2368a2" }}>
                    Multi-role Access
                  </Title>
                  <Text type="secondary">
                    Akses khusus untuk Admin, Guru, Siswa, dan Orang Tua
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        <Divider style={{ margin: 0 }} />

        <Footer
          style={{
            textAlign: "center",
            background: "#ffffff",
            padding: "24px 20px",
          }}
        >
          <Text type="secondary">
            © 2024 Presensi SMKS Cahaya Raya | Sistem Informasi Kehadiran
            Digital
          </Text>
        </Footer>
      </Content>
    </Layout>
  );
};

export default HomePage;
