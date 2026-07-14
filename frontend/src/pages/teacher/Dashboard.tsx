/** @format */

import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Typography,
  Button,
  Alert,
  Space,
  Tag,
  Tooltip,
  Skeleton,
  Empty,
  Flex,
  theme,
  Statistic,
} from "antd";
import {
  CameraOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { useToken } = theme;

interface AttendanceRecord {
  id: number;
  user_id: number;
  time_in: string;
  status: string;
  date: string;
  full_name: string;
  role: string;
  keterangan?: string;
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

interface DashboardStats {
  classCount: number;
  announcementCount: number;
  attendanceTrend: Array<{ date: string; rate: number }>;
  todaySchedule: Array<{
    id: number;
    time: string;
    subject: string;
    class_name: string;
    room?: string;
    start_time?: string;
    end_time?: string;
  }>;
  totalStudents: number;
  presentToday: number;
  attendanceRate: number;
}

interface ScheduleItem {
  id?: number;
  day?: string;
  time?: string;
  subject?: string;
  subject_name?: string;
  class_name?: string;
  room?: string;
  start_time?: string;
  end_time?: string;
}

const TeacherDashboard: React.FC = () => {
  usePageTitle("Dashboard Guru");
  const { token } = useToken();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teacherSchedules, setTeacherSchedules] = useState<ScheduleItem[]>([]);
  const [attendanceToday, setAttendanceToday] =
    useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));
  const navigate = useNavigate();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");

    const timer = setInterval(() => {
      setCurrentTime(dayjs().format("HH:mm:ss"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    checkAttendanceStatus();

    const refreshInterval = setInterval(() => {
      fetchDashboardData();
      checkAttendanceStatus();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, scheduleRes] = await Promise.all([
        api.get("/teacher/dashboard-stats"),
        api.get("/teacher/schedule"),
      ]);

      setStats(statsRes.data || null);
      setTeacherSchedules(
        Array.isArray(scheduleRes.data) ? scheduleRes.data : [],
      );
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const checkAttendanceStatus = async () => {
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const res = await api.get(`/teacher/attendance-status?date=${today}`);
      setAttendanceToday(res.data);
    } catch {
      setAttendanceToday(null);
    }
  };

  const getAttendanceStatusColor = (
    checkedIn: boolean,
    checkedOut: boolean,
  ) => {
    if (checkedIn && checkedOut) return "success";
    if (checkedIn) return "processing";
    return "default";
  };

  const getAttendanceStatusIcon = (checkedIn: boolean, checkedOut: boolean) => {
    if (checkedIn && checkedOut) return <CheckCircleOutlined />;
    if (checkedIn) return <ClockCircleOutlined />;
    return <WarningOutlined />;
  };

  const getAttendanceStatusLabel = (
    checkedIn: boolean,
    checkedOut: boolean,
  ) => {
    if (checkedIn && checkedOut) return "Selesai";
    if (checkedIn) return "Masuk";
    return "Belum Absen";
  };

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </div>
    );
  }

  const getNormalizedDay = (value?: string) => {
    const normalized = (value || "").trim().toLowerCase();
    const map: Record<string, string> = {
      senin: "senin",
      monday: "senin",
      selasa: "selasa",
      tuesday: "selasa",
      rabu: "rabu",
      wednesday: "rabu",
      kamis: "kamis",
      thursday: "kamis",
      jumat: "jumat",
      friday: "jumat",
      sabtu: "sabtu",
      saturday: "sabtu",
      minggu: "minggu",
      sunday: "minggu",
    };

    return map[normalized] || normalized;
  };

  const todaySchedule = [
    ...(Array.isArray(stats?.todaySchedule) ? stats.todaySchedule : []),
    ...teacherSchedules,
  ].filter((item: ScheduleItem) => {
    const todayName = getNormalizedDay(dayjs().locale("id").format("dddd"));
    const itemDay = getNormalizedDay(item.day);

    if (!itemDay) return false;

    return itemDay === todayName;
  });

  const tableColumns = [
    {
      title: "Jam",
      dataIndex: "time",
      key: "time",
      render: (_: string, record: ScheduleItem) => (
        <Space>
          <Text>
            {record.start_time || record.time || "-"}
            {record.end_time && ` - ${record.end_time}`}
          </Text>
        </Space>
      ),
    },
    {
      title: "Mata Pelajaran",
      key: "subject",
      render: (_: unknown, record: ScheduleItem) => (
        <Tag color="blue">{record.subject || record.subject_name || "-"}</Tag>
      ),
    },
    {
      title: "Kelas",
      key: "class_name",
      render: (_: unknown, record: ScheduleItem) => (
        <Tag color="green">{record.class_name || "-"}</Tag>
      ),
    },
    {
      title: "Ruangan",
      key: "room",
      render: (_: unknown, record: ScheduleItem) => record.room || "-",
    },
  ];

  return (
    <div style={{ textAlign: "left" }}>
      {}
      <Flex
        justify="space-between"
        align={window.innerWidth < 576 ? "flex-start" : "center"}
        vertical={window.innerWidth < 576}
        gap={12}
        style={{ marginBottom: 24 }}
      >
        <Space>
          <div style={{ textAlign: "left" }}>
            <Title
              level={5}
              style={{
                margin: 0,
                fontWeight: 700,
              }}
            >
              {greeting}, Bapak/Ibu Guru
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {dayjs().format("dddd, DD MMMM YYYY")} | Jam {currentTime}
            </Text>
          </div>
        </Space>
        <Space>
          <Tooltip title="Refresh Data">
            <Button
              type="primary"
              onClick={fetchDashboardData}
              loading={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          <Tooltip title="Jadwal Mengajar">
            <Button
              onClick={() => navigate("/teacher/schedule")}
              type="primary"
            >
              Jadwal
            </Button>
          </Tooltip>
          <Tooltip title="Buat Pengumuman">
            <Button
              onClick={() => navigate("/teacher/announcement")}
              type="primary"
            >
              Buat
            </Button>
          </Tooltip>
        </Space>
      </Flex>

      {}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorPrimaryBg }}>
            <Statistic
              title="Kelas Diampu"
              value={stats?.classCount || 0}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorWarningBg }}>
            <Statistic
              title="Total Siswa"
              value={stats?.totalStudents || 0}
              valueStyle={{ color: token.colorWarning }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorSuccessBg }}>
            <Statistic
              title="Hadir Hari Ini"
              value={stats?.presentToday || 0}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorErrorBg }}>
            <Statistic
              title="Pengumuman"
              value={stats?.announcementCount || 0}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
      </Row>

      {}
      <Row gutter={[24, 24]}>
        {}
        <Col xs={24} lg={12}>
          <Card
            title={<Text>Status Absensi Hari Ini</Text>}
            extra={
              attendanceToday && (
                <Tag
                  color={getAttendanceStatusColor(
                    attendanceToday.checkedIn,
                    attendanceToday.checkedOut,
                  )}
                  icon={getAttendanceStatusIcon(
                    attendanceToday.checkedIn,
                    attendanceToday.checkedOut,
                  )}
                  style={{ fontSize: 13, padding: "4px 12px" }}
                >
                  {getAttendanceStatusLabel(
                    attendanceToday.checkedIn,
                    attendanceToday.checkedOut,
                  )}
                </Tag>
              )
            }
          >
            {attendanceToday?.checkedIn ? (
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Flex justify="space-between" align="center" wrap>
                  <Space orientation="vertical" size={4}>
                    <Text type="secondary">Waktu Masuk</Text>
                    <Text strong style={{ fontSize: 20 }}>
                      {attendanceToday.checkInTime || "-"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs().format("DD MMMM YYYY")}
                    </Text>
                  </Space>

                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: `conic-gradient(${token.colorSuccess} 75%, ${token.colorBgLayout} 25%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: token.colorBgContainer,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircleOutlined
                        style={{ fontSize: 28, color: token.colorSuccess }}
                      />
                    </div>
                  </div>
                </Flex>

                <Alert
                  title="Absensi hari ini sudah tercatat"
                  description="Terima kasih telah melakukan absensi. Tetap semangat mengajar!"
                  type="success"
                  showIcon
                />
              </Space>
            ) : (
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Anda belum melakukan absensi hari ini"
                />

                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  block
                  onClick={() => navigate("/teacher/self-attendance")}
                >
                  Lakukan Absensi Sekarang
                </Button>
              </Space>
            )}
          </Card>
        </Col>

        {}
        <Col xs={24} lg={12}>
          <Card
            title={<Text>Jadwal Mengajar Hari Ini</Text>}
            extra={
              <Button type="link" onClick={() => navigate("/teacher/schedule")}>
                Lihat Semua <ArrowRightOutlined />
              </Button>
            }
          >
            {todaySchedule.length > 0 ? (
              <Table
                dataSource={todaySchedule}
                rowKey={(record, index) =>
                  `${index}-${record.start_time || record.time || ""}-${record.subject || ""}`
                }
                pagination={false}
                columns={tableColumns}
                scroll={{ x: "max-content" }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Tidak ada jadwal mengajar hari ini"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
export default TeacherDashboard;
