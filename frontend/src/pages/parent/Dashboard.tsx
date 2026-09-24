/** @format */

import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  Button,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BellOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

interface AttendanceData {
  id: number;
  date: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpha";
  subject: string;
  teacher: string;
}

interface Announcement {
  id: number;
  title: string;
  date: string;
  priority: "Penting" | "Biasa";
  content: string;
}

const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userName = user?.full_name || user?.name || "Orang Tua";
  const childName = user?.childName || "Anak";

  const [attendanceData] = useState<AttendanceData[]>([
    {
      id: 1,
      date: "2026-07-03",
      status: "Hadir",
      subject: "Matematika",
      teacher: "Budi Santoso",
    },
    {
      id: 2,
      date: "2026-07-02",
      status: "Hadir",
      subject: "Bahasa Indonesia",
      teacher: "Siti Rahayu",
    },
    {
      id: 3,
      date: "2026-07-01",
      status: "Sakit",
      subject: "Pemrograman Web",
      teacher: "Agus Wijaya",
    },
    {
      id: 4,
      date: "2026-06-30",
      status: "Hadir",
      subject: "Pendidikan Agama",
      teacher: "Muhammad Ali",
    },
    {
      id: 5,
      date: "2026-06-29",
      status: "Izin",
      subject: "Bahasa Inggris",
      teacher: "Dewi Lestari",
    },
  ]);

  const [announcements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Pengumuman Ujian Semester",
      date: "2026-07-10",
      priority: "Penting",
      content: "Ujian semester akan dilaksanakan pada tanggal 15-20 Juli 2026",
    },
    {
      id: 2,
      title: "Libur Hari Raya",
      date: "2026-07-15",
      priority: "Biasa",
      content: "Libur hari raya akan dilaksanakan pada tanggal 17-19 Juli 2026",
    },
  ]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hadir":
        return "success";
      case "Izin":
        return "warning";
      case "Sakit":
        return "processing";
      case "Alpha":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Hadir":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "Izin":
        return <ClockCircleOutlined style={{ color: "#faad14" }} />;
      case "Sakit":
        return <CloseCircleOutlined style={{ color: "#1890ff" }} />;
      case "Alpha":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: "Tanggal",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString("id-ID"),
    },
    {
      title: "Mata Pelajaran",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Guru",
      dataIndex: "teacher",
      key: "teacher",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      ),
    },
  ];

  const totalHadir = attendanceData.filter((d) => d.status === "Hadir").length;
  const totalIzin = attendanceData.filter((d) => d.status === "Izin").length;
  const totalSakit = attendanceData.filter((d) => d.status === "Sakit").length;
  const totalAlpha = attendanceData.filter((d) => d.status === "Alpha").length;
  const totalKehadiran = attendanceData.length;

  return (
    <div className="parent-dashboard">
      {}
      <div className="parent-dashboard-welcome">
        <Title
          level={5}
          style={{
            margin: 0,
            fontWeight: 700,
          }}
        >
          Selamat Datang,{" "}
          <span className="parent-dashboard-name">{userName}</span>
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Pantau perkembangan dan aktivitas {childName} di sekolah
        </Text>
      </div>

      {}
      <Row gutter={[16, 16]} className="parent-dashboard-stats">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Kehadiran"
              value={totalHadir}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              suffix={`/ ${totalKehadiran}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Izin"
              value={totalIzin}
              prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sakit"
              value={totalSakit}
              prefix={<CloseCircleOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Alpha"
              value={totalAlpha}
              prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
            />
          </Card>
        </Col>
      </Row>

      {}
      <Row gutter={[16, 16]}>
        {}
        <Col xs={24} lg={16}>
          <Card
            title="Riwayat Presensi Terbaru"
            extra={
              <Button
                type="link"
                onClick={() => navigate("/parent/attendance")}
              >
                Lihat Semua <ArrowRightOutlined />
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={attendanceData.slice(0, 5)}
              pagination={false}
              loading={loading}
              rowKey="id"
            />
          </Card>
        </Col>

        {}
        <Col xs={24} lg={8}>
          {}
          <Card
            title="Pengumuman Terbaru"
            extra={
              <Button
                type="link"
                onClick={() => navigate("/parent/announcements")}
              >
                Lihat Semua
              </Button>
            }
            className="parent-dashboard-announcements"
          >
            <Timeline>
              {announcements.map((item) => (
                <Timeline.Item
                  key={item.id}
                  color={item.priority === "Penting" ? "red" : "blue"}
                  dot={
                    item.priority === "Penting" ? (
                      <BellOutlined style={{ color: "#ff4d4f" }} />
                    ) : (
                      <BellOutlined style={{ color: "#1890ff" }} />
                    )
                  }
                >
                  <div className="parent-dashboard-announcement-item">
                    <Text strong>{item.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.date).toLocaleDateString("id-ID")}
                    </Text>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ marginTop: 4, fontSize: 13 }}
                    >
                      {item.content}
                    </Paragraph>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ParentDashboard;
