/** @format */

import React, { useState, useCallback } from "react";
import {
  Typography,
  DatePicker,
  Button,
  Space,
  Tag,
  message,
  Spin,
  Row,
  Col,
  Table,
  theme,
  Grid,
  Select,
  Flex,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";
import type { ColumnsType } from "antd/es/table";
import type { Key } from "react";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface AttendanceHistory {
  id: number;
  date: string;
  time_in: string;
  time_out: string | null;
  status: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
}

interface AttendanceHistoryProps {
  apiEndpoint?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  onTime: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message || fallback;
  }

  return fallback;
};

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  apiEndpoint = "/attendance/history",
}) => {
  usePageTitle("Riwayat Presensi");
  const { token } = useToken();
  const screens = useBreakpoint();

  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );
  const [history, setHistory] = useState<AttendanceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    onTime: 0,
  });
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [weekRange, setWeekRange] = useState<[string, string]>([
    dayjs().startOf("week").format("YYYY-MM-DD"),
    dayjs().endOf("week").format("YYYY-MM-DD"),
  ]);

  const isSmallScreen = !screens.md;

  const calculateStats = useCallback((data: AttendanceHistory[]) => {
    const total = data.length;
    const present = data.filter((item) => item.status === "Hadir").length;
    const late = data.filter((item) => item.status === "Terlambat").length;
    const absent = data.filter((item) => item.status === "Alpa").length;
    const onTime = data.filter(
      (item) => item.status === "Hadir" && item.time_in <= "07:00:00",
    ).length;

    setStats({
      total,
      present,
      late,
      absent,
      onTime,
    });
  }, []);

  const fetchAttendanceHistory = useCallback(async () => {
    setLoading(true);
    try {
      let params = {};

      if (viewMode === "day") {
        params = { date: selectedDate };
      } else if (viewMode === "week") {
        params = { startDate: weekRange[0], endDate: weekRange[1] };
      } else {
        params = { month: dayjs(selectedDate).format("YYYY-MM") };
      }

      const response = await api.get(apiEndpoint, { params });

      const sortedData = response.data.sort(
        (a: AttendanceHistory, b: AttendanceHistory) =>
          dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
      );

      setHistory(sortedData);
      calculateStats(sortedData);
      message.success("Data berhasil dimuat", 1.5);
    } catch (error) {
      message.error(
        getErrorMessage(error, "Gagal memuat data riwayat presensi"),
      );
      setHistory([]);
      setStats({ total: 0, present: 0, late: 0, absent: 0, onTime: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode, weekRange, calculateStats, apiEndpoint]);

  const handleViewModeChange = (mode: "day" | "week" | "month") => {
    setViewMode(mode);
    if (mode === "day") {
      setSelectedDate(dayjs().format("YYYY-MM-DD"));
    } else if (mode === "week") {
      setWeekRange([
        dayjs().startOf("week").format("YYYY-MM-DD"),
        dayjs().endOf("week").format("YYYY-MM-DD"),
      ]);
    } else if (mode === "month") {
      setSelectedDate(dayjs().format("YYYY-MM-DD"));
    }
  };

  const handleRefresh = () => {
    fetchAttendanceHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "hadir":
        return { color: "green" };
      case "terlambat":
        return { color: "orange" };
      case "alpa":
        return { color: "red" };
      default:
        return { color: "default" };
    }
  };

  const columns: ColumnsType<AttendanceHistory> = [
    {
      title: "No",
      key: "no",
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: "Tanggal",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a: AttendanceHistory, b: AttendanceHistory) =>
        dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
    },
    {
      title: "Jam Masuk",
      dataIndex: "time_in",
      key: "time_in",
      width: 120,
      render: (time_in: string) => (
        <Space>
          <Text>{time_in && time_in !== "null" ? time_in : "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Jam Keluar",
      dataIndex: "time_out",
      key: "time_out",
      width: 120,
      render: (time_out: string | null) => (
        <Space>
          <Text>{time_out && time_out !== "null" ? time_out : "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const { color } = getStatusColor(status);
        return (
          <Tag color={color} style={{ padding: "4px 12px", borderRadius: 16 }}>
            {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase()}
          </Tag>
        );
      },
      filters: [
        { text: "Hadir", value: "hadir" },
        { text: "Terlambat", value: "terlambat" },
        { text: "Tidak Hadir", value: "alpa" },
      ],

      onFilter: (value: boolean | Key, record: AttendanceHistory) => {
        return record.status?.toLowerCase() === String(value);
      },
    },
  ];

  return (
    <div style={{ textAlign: "left" }}>
      {}
      <Row
        justify="space-between"
        align={isSmallScreen ? "top" : "middle"}
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col flex="auto">
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Riwayat Presensi
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Lihat detail kehadiranmu berdasarkan tanggal, minggu, atau bulan
          </Text>
        </Col>
      </Row>

      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <Space wrap>
          <Select
            value={viewMode}
            onChange={handleViewModeChange}
            style={{ width: 140 }}
            options={[
              { label: "Harian", value: "day" },
              { label: "Mingguan", value: "week" },
              { label: "Bulanan", value: "month" },
            ]}
          />
          <DatePicker
            picker={
              viewMode === "month"
                ? "month"
                : viewMode === "week"
                  ? "week"
                  : undefined
            }
            value={
              viewMode === "week" ? dayjs(weekRange[0]) : dayjs(selectedDate)
            }
            onChange={(date) => {
              if (!date) return;
              if (viewMode === "week") {
                const start = date.startOf("week").format("YYYY-MM-DD");
                const end = date.endOf("week").format("YYYY-MM-DD");
                setWeekRange([start, end]);
              } else {
                setSelectedDate(date.format("YYYY-MM-DD"));
              }
            }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            size="middle"
            style={{
              backgroundColor: token.colorPrimary,
              color: token.colorTextLightSolid,
            }}
          >
            Refresh
          </Button>
        </Space>

        <Text type="secondary">
          Menampilkan {history.length} dari {stats.total} data presensi
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={history}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]} dari ${total} data`,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: 600 }}
        />
      </Spin>
    </div>
  );
};

export default AttendanceHistory;
