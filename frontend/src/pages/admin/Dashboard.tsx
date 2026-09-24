/** @format */

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  DatePicker,
  Space,
  Skeleton,
  theme,
  Flex,
  Badge,
  Button,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RightOutlined,
  BookOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Line, Bar } from "@ant-design/charts";
import api from "../../api/instance";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

type RecentLog = {
  key?: string;
  full_name: string;
  role: string;
  time_in: string;
  status: string;
  class: string;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useToken();
  const [data, setData] = useState<{
    stats?: any;
    recentLogs?: RecentLog[];
  } | null>(null);
  const [attendanceTrendsData, setAttendanceTrendsData] = useState<any[]>([]);
  const [latenessDistributionData, setLatenessDistributionData] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    document.title = "Sikdi CHR | Dashboard";
    return () => {
      document.title = "Sikdi CHR |";
    };
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const fetchDashboardData = async (dateParam: string) => {
    try {
      setLoading(true);
      const statsRes = await api.get("/admin/stats", {
        params: { date: dateParam },
      });
      const trendsRes = await api.get("/admin/attendance-trends");
      const latenessRes = await api.get("/admin/lateness-by-major");

      setData(statsRes.data);
      setAttendanceTrendsData(trendsRes.data);
      setLatenessDistributionData(latenessRes.data);
      message.success("Data berhasil diperbarui");
    } catch (err) {
      message.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(selectedDate);
  };

  const primaryColor = token.colorPrimary;
  const successColor = token.colorSuccess;
  const warningColor = token.colorWarning;

  const stats = data?.stats;

  const lineConfig = {
    data: attendanceTrendsData,
    xField: "label",
    yField: "value",
    smooth: true,
    color: primaryColor,
    area: {
      style: {
        fill: `l(270) 0:${token.colorBgContainer} 0.5:${primaryColor}20 1:${primaryColor}40`,
        fillOpacity: 0.3,
      },
    },
    point: {
      size: 5,
      shape: "circle",
      style: {
        fill: primaryColor,
        stroke: token.colorBgContainer,
        lineWidth: 2,
      },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: "Kehadiran",
        value: `${datum.value}%`,
      }),
    },
  };

  const barConfig = {
    data: latenessDistributionData,
    xField: "value",
    yField: "type",
    seriesField: "type",
    color: successColor,
    barWidthRatio: 0.5,
    legend: false,
    label: { position: "right", style: { fill: token.colorTextSecondary } },
    tooltip: {
      formatter: (datum: any) => ({ name: "Jumlah", value: datum.value }),
    },
  };

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ textAlign: "left" }}>
      <Flex
        justify="space-between"
        align={window.innerWidth < 576 ? "flex-start" : "center"}
        vertical={window.innerWidth < 576}
        gap={12}
        style={{ marginBottom: 24 }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Dashboard Admin
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Pantau statistik dan aktivitas presensi secara real-time
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(_, dateString) =>
              setSelectedDate(
                dayjs(dateString as string, "DD/MM/YYYY").format("YYYY-MM-DD"),
              )
            }
            format="DD/MM/YYYY"
            allowClear={false}
            suffixIcon={<CalendarOutlined />}
            style={{ borderRadius: token.borderRadiusLG }}
          />
        </Space>
      </Flex>

      {}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorPrimaryBg }}>
            <Statistic
              title={<Space>Jumlah Siswa</Space>}
              value={stats.siswa}
              valueStyle={{
                color: primaryColor,
              }}
            />
            <div style={{ marginTop: 12 }}>
              <Badge
                count={`+${stats.siswaBaru} baru`}
                style={{ backgroundColor: successColor }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorWarningBg }}>
            <Statistic
              title={<Space>Jumlah Guru </Space>}
              value={stats.guru}
              valueStyle={{
                color: primaryColor,
              }}
            />
            <div style={{ marginTop: 12 }}>
              <Badge
                count={`+${stats.guruBaru} baru`}
                style={{ backgroundColor: successColor }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorSuccessBg }}>
            <Statistic
              title={<Space>Tingkat Kehadiran </Space>}
              value={stats.kehadiranRate}
              suffix="%"
              valueStyle={{
                color: successColor,
              }}
            />
            <div style={{ marginTop: 12 }}>
              <Tag
                color={stats.kehadiranChange >= 0 ? "success" : "error"}
                icon={
                  stats.kehadiranChange >= 0 ? (
                    <ArrowUpOutlined />
                  ) : (
                    <ArrowDownOutlined />
                  )
                }
              >
                {Math.abs(stats.kehadiranChange)}%
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ backgroundColor: token.colorErrorBg }}>
            <Statistic
              title={<Space>Terlambat Hari Ini</Space>}
              value={stats.terlambatHariIni}
              valueStyle={{
                color: warningColor,
              }}
            />
            <div style={{ marginTop: 12 }}>
              <Tag color="warning" icon={<ClockCircleOutlined />}>
                {stats.terlambatHariIni} orang
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {}
      <Title level={4} style={{ marginBottom: 16 }}>
        ⚡ Akses Cepat
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 40, textAlign: "left" }}>
        {[
          {
            title: "Manajemen Akun Siswa",
            desc: "Tambah, edit, atau hapus siswa",
            icon: TeamOutlined,
            path: "/admin/manage-students",
            color: primaryColor,
          },
          {
            title: "Manajemen Akun Guru",
            desc: "Kelola data akun staff pengajar",
            icon: UserOutlined,
            path: "/admin/manage-teachers",
            color: successColor,
          },
          {
            title: "Kelas & Jurusan",
            desc: "Atur struktur akademik",
            icon: BookOutlined,
            path: "/admin/manage-classes",
            color: token.colorWarning,
          },
          {
            title: "Laporan & Evaluasi",
            desc: "Lihat laporan presensi",
            icon: BarChartOutlined,
            path: "/admin/reports",
            color: token.colorInfo,
          },
        ].map((item, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card
              hoverable
              bordered={false}
              style={{
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowTertiary,
              }}
              bodyStyle={{ padding: "16px" }}
              onClick={() => navigate(item.path)}
            >
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={16}>
                  <div
                    style={{
                      backgroundColor: `${item.color}15`,
                      padding: 10,
                      borderRadius: token.borderRadiusLG,
                    }}
                  >
                    <item.icon style={{ fontSize: 22, color: item.color }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 15 }}>
                      {item.title}
                    </Text>
                    <Paragraph
                      type="secondary"
                      style={{ margin: 0, fontSize: 12 }}
                    >
                      {item.desc}
                    </Paragraph>
                  </div>
                </Flex>
                <RightOutlined
                  style={{ color: token.colorTextQuaternary, fontSize: 12 }}
                />
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong>Tren Kehadiran (Minggu Ini)</Text>}
            bordered={false}
            style={{
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowTertiary,
            }}
            extra={<Tag color="processing">Live</Tag>}
            bodyStyle={{ padding: "16px" }}
          >
            <div style={{ height: 280 }}>
              <Line {...lineConfig} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong>Keterlambatan per Jurusan</Text>}
            bordered={false}
            style={{
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowTertiary,
            }}
            extra={<Tag color="warning">Hari Ini</Tag>}
            bodyStyle={{ padding: "16px" }}
          >
            <div style={{ height: 280 }}>
              <Bar {...barConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      {}
      <Card
        title={<Text strong>Aktivitas Presensi Terbaru</Text>}
        bordered={false}
        style={{
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowTertiary,
        }}
        extra={
          <Typography.Link onClick={() => navigate("/admin/reports")}>
            Lihat Semua <RightOutlined />
          </Typography.Link>
        }
        bodyStyle={{ padding: "16px" }}
      >
        <Table
          dataSource={(data?.recentLogs || []).map((log, index) => ({
            ...log,
            key: `${log.full_name}-${log.time_in}-${index}`,
          }))}
          loading={loading}
          rowKey="key"
          pagination={false}
          size="middle"
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "Personel",
              dataIndex: "full_name",
              key: "full_name",
              render: (text, record) => (
                <Space>
                  <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {record.class || record.role}
                    </Text>
                  </div>
                </Space>
              ),
            },
            {
              title: "Waktu",
              dataIndex: "time_in",
              key: "time_in",
              render: (time) => (
                <Space>
                  <ClockCircleOutlined
                    style={{ color: token.colorTextSecondary }}
                  />
                  <Text>{time}</Text>
                </Space>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              align: "right",
              render: (status) => (
                <Tag
                  color={
                    status?.toLowerCase() === "hadir" ? "success" : "error"
                  }
                  style={{ borderRadius: 16, padding: "2px 12px" }}
                >
                  {status?.charAt(0).toUpperCase() +
                    status?.slice(1).toLowerCase()}
                </Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
