

import React, { useState, useEffect } from "react";
import {
  Table,
  DatePicker,
  Button,
  Typography,
  Tag,
  Tooltip,
  Flex,
  theme,
  Grid,
  message,
  Select,
  Space,
  Spin,
} from "antd";
import {
  FileExcelOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";
import { exportAttendanceToExcel } from "../../utils/excelExport";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface ReportData {
  id: number;
  date: string;
  full_name: string;
  role: string;
  class_name: string;
  time_in: string;
  time_out: string;
  location_lat: number;
  location_lng: number;
  status: string;
}

const AttendanceReport: React.FC = () => {
  usePageTitle("Laporan Presensi");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [data, setData] = useState<ReportData[]>([]);
  const [filteredData, setFilteredData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null); 
  const [classOptions, setClassOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const isSmallScreen = !screens.md;

  const fetchClassOptions = async () => {
    try {
      const res = await api.get("/admin/classes"); 
      const classes = res.data.map((cls: any) => ({
        label: cls.name || cls.class_name,
        value: cls.id?.toString() || cls.name,
      }));
      setClassOptions(classes);
    } catch (err) {
    }
  };

  const buildReportParams = () => {
    const params = new URLSearchParams();
    if (selectedDate) {
      params.append("date", selectedDate);
    }
    if (selectedRole) {
      params.append("role", selectedRole);
    }
    if (selectedClass) {
      params.append("class_id", selectedClass);
    }
    return params;
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = buildReportParams();
      const url = params.toString()
        ? `/admin/reports?${params.toString()}`
        : "/admin/reports";

      const res = await api.get(url);
      setData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      message.error("Gagal memuat data laporan presensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassOptions(); 
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedRole, selectedDate, selectedClass]); 

  const columns = [
    {
      title: "Tanggal",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (text: string) => dayjs(text).format("DD MMM YYYY"),
    },
    {
      title: "Nama Lengkap",
      dataIndex: "full_name",
      key: "full_name",
      width: 200,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role: string) => (
        <Tag color={role === "guru" ? token.colorPrimary : token.colorSuccess}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Kelas",
      dataIndex: "class_name",
      key: "class_name",
      width: 150,
      render: (val: string) => val || "-",
    },
    {
      title: "Jam Masuk",
      dataIndex: "time_in",
      key: "time_in",
      width: 120,
      render: (time: string, record: ReportData) => {
        const tagColor =
          record.status?.toLowerCase() === "hadir" ? "cyan" : "red";
        return (
          <Tag
            color={tagColor}
            style={{ fontSize: "14px", padding: "4px 12px" }}
          >
            {time}
          </Tag>
        );
      },
    },
    {
      title: "Jam Keluar",
      dataIndex: "time_out",
      key: "time_out",
      width: 120,
      render: (val: string | null) => {
        if (!val || val === "null") {
          return <Tag color="default">Belum</Tag>;
        }
        return <span>{val}</span>;
      },
    },
    {
      title: "Lokasi",
      key: "location",
      width: 80,
      render: (_: any, record: ReportData) => (
        <Tooltip title="Lihat di Google Maps">
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() =>
              window.open(
                `https://www.google.com/maps?q=${record.location_lat},${record.location_lng}`,
                "_blank",
              )
            }
          />
        </Tooltip>
      ),
    },
  ];

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      message.warning("Tidak ada data untuk diexport");
      return;
    }

    setExporting(true);
    try {
      const params = buildReportParams();
      const url = params.toString()
        ? `/admin/reports?${params.toString()}`
        : "/admin/reports";
      const res = await api.get(url);
      const selectedClassLabel =
        classOptions.find((option) => option.value === selectedClass)?.label ||
        selectedClass;

      exportAttendanceToExcel(res.data, {
        date: selectedDate,
        role: selectedRole,
        className: selectedClassLabel,
        classId: selectedClass,
      });
      message.success("File Excel berhasil didownload");
    } catch (error) {
      message.error("Gagal mengexport data ke Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ textAlign: "left" }}>
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div>
          <Title
            level={4}
            style={{
              margin: 0,
              fontWeight: 700,
            }}
          >
            Laporan Presensi
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Lihat dan analisis data presensi guru dan siswa berdasarkan tanggal,
            role dan kelas
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchReport}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="dashed"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            disabled={filteredData.length === 0 || exporting}
            loading={exporting}
          >
            Export Excel
          </Button>
        </Space>
      </Flex>

      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <Space wrap>
          <DatePicker
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={(date) =>
              setSelectedDate(date ? date.format("YYYY-MM-DD") : null)
            }
            format="DD/MM/YYYY"
            allowClear
            placeholder="Pilih tanggal (opsional)"
            size="medium"
            style={{ width: "100%" }}
          />
          <Select
            placeholder="Filter Role"
            value={selectedRole}
            onChange={setSelectedRole}
            size="medium"
            allowClear
            style={{ width: "100%" }}
            options={[
              { label: "Guru", value: "guru" },
              { label: "Siswa", value: "siswa" },
            ]}
          />
          <Select
            placeholder="Filter Kelas"
            value={selectedClass}
            onChange={setSelectedClass}
            size="medium"
            allowClear
            style={{ width: "100%" }}
            options={classOptions}
            loading={classOptions.length === 0}
            showSearch 
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Menampilkan {filteredData.length} dari {data.length} presensi
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} presensi`,
          }}
          scroll={{ x: "max-content" }}
          style={{ marginTop: 0 }}
        />
      </Spin>
    </div>
  );
};

export default AttendanceReport;
