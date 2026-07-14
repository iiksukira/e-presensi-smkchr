/** @format */

import {
  Card,
  Col,
  Row,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Empty,
  theme,
  Tag,
  Flex,
  Tooltip,
  Statistic,
  Table,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  ReloadOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import api from "../../api/instance";
import { getLoginRouteFromRole } from "../../utils/authRoutes";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;

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

interface UserSession {
  id: number;
  full_name: string;
  role: string;
  class?: string;
  nis?: string;
  photo_url?: string;
}

interface DashboardStats {
  attendance?: {
    checkedIn: boolean;
    checkedOut?: boolean;
    status?: string;
  };
  schedule?: any[];
  announcements?: any[];
  total_attendance?: number;
  attendance_percentage?: number;
  total_schedules?: number;
  upcoming_events?: any[];
}

interface ScheduleItem {
  id?: number;
  day?: string;
  start_time?: string;
  end_time?: string;
  subject?: string;
  room?: string;
  class_name?: string;
}

const StudentDashboard: React.FC = () => {
  usePageTitle("Dashboard Siswa");
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserSession | null>(null);
  const [attendanceToday, setAttendanceToday] =
    useState<AttendanceRecord | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));
  const [loading, setLoading] = useState(true);
  const [, setIsSmallScreen] = useState(window.innerWidth <= 768);

  dayjs.locale("id");

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");

    const timer = setInterval(() => {
      setCurrentTime(dayjs().format("HH:mm:ss"));
    }, 1000);

    const token = sessionStorage.getItem("token");
    const userData = sessionStorage.getItem("user");

    if (!token || !userData) {
      navigate(getLoginRouteFromRole("siswa"));
      return;
    }

    try {
      const parsedUser = JSON.parse(userData) as UserSession;
      if (parsedUser.role !== "siswa") {
        navigate(getLoginRouteFromRole("siswa"));
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      navigate(getLoginRouteFromRole("siswa"));
      return;
    }

    fetchDashboardData();

    return () => clearInterval(timer);
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userData = sessionStorage.getItem("user");
      if (!userData) return;

      const parsedUser = JSON.parse(userData) as UserSession;

      const [attendanceRes, statsRes] = await Promise.all([
        api.get("/attendance/today"),
        api.get("/student/dashboard"),
      ]);

      const todayAttendance = attendanceRes.data.find(
        (att: AttendanceRecord) => att.user_id === parsedUser.id,
      );
      setAttendanceToday(todayAttendance || null);
      setDashboardStats(statsRes.data || {});
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "70vh" }}>
        <Spin size="large" description="Memuat dashboard..." />
      </Flex>
    );
  }

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

  const todaySchedule = (dashboardStats?.schedule || []).filter(
    (item: ScheduleItem) => {
      const todayName = dayjs().locale("id").format("dddd");
      const itemDay = (item.day || "").toLowerCase();
      return itemDay === todayName.toLowerCase();
    },
  );

  const tableColumns = [
    {
      title: "Jam",
      key: "time",
      render: (_: unknown, record: ScheduleItem) => (
        <Text>
          {record.start_time || "-"}
          {record.end_time ? ` - ${record.end_time}` : ""}
        </Text>
      ),
    },
    {
      title: "Mata Pelajaran",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string | undefined) => (
        <Tag color="blue">{subject || "-"}</Tag>
      ),
    },
    {
      title: "Kelas",
      dataIndex: "class_name",
      key: "class_name",
      render: (className: string | undefined) => (
        <Tag color="green">{className || "-"}</Tag>
      ),
    },
    {
      title: "Ruangan",
      dataIndex: "room",
      key: "room",
      render: (room: string | undefined) => room || "-",
    },
  ];

  const checkedIn = !!attendanceToday?.time_in;
  const checkedOut = !!(attendanceToday as any)?.time_out;

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
          <div>
            <Title
              level={5}
              style={{
                margin: 0,
                fontWeight: 700,
              }}
            >
              {greeting}, {user?.full_name || "Siswa"}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {dayjs().format("dddd, DD MMMM YYYY")} | Jam {currentTime}
            </Text>
          </div>
        </Space>

        <Tooltip title="Refresh Data">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchDashboardData}
            loading={loading}
          >
            Refresh
          </Button>
        </Tooltip>
      </Flex>

      {}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ backgroundColor: token.colorPrimaryBg }}>
            <Statistic
              title="Kehadiran Bulan Ini"
              value={dashboardStats?.attendance_percentage || 0}
              suffix="%"
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ backgroundColor: token.colorWarningBg }}>
            <Statistic
              title="Total Kehadiran"
              value={dashboardStats?.total_attendance || 0}
              valueStyle={{ color: token.colorWarning }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ backgroundColor: token.colorSuccessBg }}>
            <Statistic
              title="Total Jadwal"
              value={dashboardStats?.total_schedules || 0}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ backgroundColor: token.colorErrorBg }}>
            <Statistic
              title="Pengumuman"
              value={dashboardStats?.announcements?.length || 0}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
      </Row>

      {}
      <Row gutter={[24, 24]}>
        {}
        <Col xs={24} md={12}>
          <Card
            title={<Text>Status Absensi Hari Ini</Text>}
            extra={
              attendanceToday && (
                <Tag
                  color={getAttendanceStatusColor(checkedIn, checkedOut)}
                  icon={getAttendanceStatusIcon(checkedIn, checkedOut)}
                  style={{ fontSize: 13, padding: "4px 12px" }}
                >
                  {getAttendanceStatusLabel(checkedIn, checkedOut)}
                </Tag>
              )
            }
          >
            {checkedIn ? (
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Flex justify="space-between" align="center" wrap>
                  <Space orientation="vertical" size={4}>
                    <Text type="secondary">Waktu Masuk</Text>
                    <Text strong style={{ fontSize: 20 }}>
                      {attendanceToday?.time_in &&
                      dayjs(attendanceToday.time_in, "HH:mm:ss").isValid()
                        ? dayjs(attendanceToday.time_in, "HH:mm:ss").format(
                            " HH:mm:ss",
                          )
                        : attendanceToday?.time_in || "-"}
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

                {attendanceToday.keterangan && (
                  <Alert
                    title="Keterangan"
                    description={attendanceToday.keterangan}
                    type="info"
                    showIcon
                  />
                )}

                <Alert
                  title="Absensi hari ini sudah tercatat"
                  description="Terima kasih telah melakukan absensi. Tetap semangat belajar!"
                  type="success"
                  showIcon
                />
              </Space>
            ) : (
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Anda belum melakukan absensi hari ini
"
                />
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  block
                  onClick={() => navigate("/student/self-attendance")}
                >
                  Lakukan Absensi Sekarang
                </Button>
              </Space>
            )}
          </Card>
        </Col>

        {}
        <Col xs={24} md={12}>
          <Card
            title={<Text>Jadwal Pelajaran Hari Ini</Text>}
            extra={
              <Button type="link" onClick={() => navigate("/student/schedule")}>
                Lihat Semua <ArrowRightOutlined />
              </Button>
            }
          >
            {todaySchedule.length > 0 ? (
              <Table
                dataSource={todaySchedule}
                rowKey={(record, index) =>
                  `${index}-${record.start_time || ""}-${record.subject || ""}`
                }
                pagination={false}
                columns={tableColumns}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Tidak ada jadwal pelajaran hari ini"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;
