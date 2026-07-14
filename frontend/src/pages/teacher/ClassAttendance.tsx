/** @format */

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Select,
  Space,
  Card,
  Typography,
  message,
  Button,
  DatePicker,
  Tag,
  Spin,
  Flex,
  theme,
  Grid,
  Statistic,
  Row,
  Col,
  Alert,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { Option } = Select;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Class {
  id: number;
  class_name: string;
  major: string;
}

interface Student {
  user_id: number;
  nisn: string;
  full_name: string;
  status?: "Hadir" | "Terlambat" | "Alpa";
  time_in?: string;
  note?: string;
}

interface AttendanceStats {
  present: number;
  sick: number;
  permit: number;
  absent: number;
  total: number;
  percentage: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message || fallback;
  }

  return fallback;
};

const ClassAttendance: React.FC = () => {
  usePageTitle("Presensi Siswa Per Kelas");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    sick: 0,
    permit: 0,
    absent: 0,
    total: 0,
    percentage: 0,
  });

  const isSmallScreen = !screens.md;

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get("/teacher/my-classes");
      setClasses(response.data);
    } catch {
      message.error("Gagal mengambil data kelas");
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const fetchStudents = useCallback(async (classId: number, date: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/students-by-class/${classId}`, {
        params: { date },
      });

      const studentsData = response.data;
      setStudents(studentsData);

      calculateStats(studentsData);
    } catch (error) {
      message.error(getErrorMessage(error, "Gagal mengambil data siswa"));

      setStats({
        present: 0,
        sick: 0,
        permit: 0,
        absent: 0,
        total: 0,
        percentage: 0,
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (studentsData: Student[]) => {
    const present = studentsData.filter((s) => s.status === "Hadir").length;
    const late = studentsData.filter((s) => s.status === "Terlambat").length;
    const absent = studentsData.filter(
      (s) => s.status === "Alpa" || !s.status,
    ).length;
    const total = studentsData.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    setStats({
      present,
      sick: late,
      permit: 0,
      absent,
      total,
      percentage,
    });
  };

  useEffect(() => {
    if (selectedClass) {
      void fetchStudents(selectedClass, selectedDate);
    } else {
      setStudents([]);
      setStats({
        present: 0,
        sick: 0,
        permit: 0,
        absent: 0,
        total: 0,
        percentage: 0,
      });
    }
  }, [selectedClass, selectedDate, fetchStudents]);

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

  const columns = [
    {
      title: "No",
      key: "no",
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: "NISN",
      dataIndex: "nisn",
      key: "nisn",
      render: (nisn: string) => <Text>{nisn}</Text>,
    },
    {
      title: "Nama Siswa",
      dataIndex: "full_name",
      key: "full_name",
      render: (name: string) => <Text strong>{name}</Text>,
      sorter: (a: Student, b: Student) =>
        a.full_name.localeCompare(b.full_name),
    },
    {
      title: "Jam Masuk",
      dataIndex: "time_in",
      key: "time_in",
      render: (time: string) => time || "-",
    },
    {
      title: "Jam Keluar",
      dataIndex: "time_out",
      key: "time_out",
      render: (time: string) => time || "-",
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: Student) => (
        <Tag {...getStatusColor(record.status || "Alpa")}>
          {record.status || "Alpa"}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ textAlign: "left" }}>
      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Riwayat Presensi Kelas
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Lihat detail kehadiran siswa per kelas dan tanggal
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            selectedClass && fetchStudents(selectedClass, selectedDate)
          }
          loading={loading}
          size="medium"
          style={{
            backgroundColor: token.colorPrimary,
            color: token.colorTextLightSolid,
          }}
        >
          Refresh
        </Button>
      </Flex>

      {}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} lg={6}>
          <Card style={{ backgroundColor: token.colorPrimaryBg }}>
            <Statistic
              title="Total Siswa"
              value={selectedClass ? stats.total : classes.length > 0 ? "0" : 0}
              styles={{ content: { color: token.colorPrimary } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            style={{
              backgroundColor: token.colorSuccessBg,
            }}
          >
            <Statistic
              title="Hadir"
              value={stats.present}
              styles={{ content: { color: token.colorSuccess } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            style={{
              backgroundColor: token.colorWarningBg,
            }}
          >
            <Statistic
              title="Terlambat"
              value={stats.sick}
              styles={{ content: { color: token.colorWarning } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            style={{
              backgroundColor: token.colorErrorBg,
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowTertiary,
            }}
            hoverable
          >
            <Statistic
              title="Tidak Hadir"
              value={stats.absent}
              styles={{ content: { color: token.colorError } }}
            />
          </Card>
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
            placeholder="Pilih Kelas"
            onChange={(val) => setSelectedClass(val)}
            value={selectedClass}
            showSearch
            optionFilterProp="children"
            allowClear
            style={{ width: 200, minWidth: 100 }}
          >
            {classes.map((c: Class) => (
              <Option key={c.id} value={c.id}>
                {c.class_name} - {c.major}
              </Option>
            ))}
          </Select>
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(date) =>
              setSelectedDate(
                date?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
              )
            }
            format="DD/MM/YYYY"
            allowClear={false}
          />
        </Space>
        <Text type="secondary">Menampilkan {students.length} siswa</Text>
      </Flex>

      {}
      {!selectedClass && (
        <Alert
          message="Belum ada kelas dipilih"
          type="info"
          style={{ marginBottom: 24, borderRadius: token.borderRadiusLG }}
        />
      )}

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="user_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} siswa`,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: isSmallScreen ? 800 : undefined }}
        />
      </Spin>
    </div>
  );
};

export default ClassAttendance;
