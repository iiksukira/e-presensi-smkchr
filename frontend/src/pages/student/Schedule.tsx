/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Typography,
  Spin,
  Button,
  Space,
  message,
  Flex,
  theme,
  Grid,
  Select,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Schedule {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  time_range: string;
  subject_name: string;
  class_id: number;
  class_name: string;
  room: string;
  teacher_name: string;
}

const StudentSchedule: React.FC = () => {
  usePageTitle("Jadwal Pelajaran");
  const { token } = useToken();
  const screens = useBreakpoint();

  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [filteredSchedule, setFilteredSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("all");

  const isSmallScreen = !screens.md;
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/student/schedule");
      setSchedule(res.data);
      setFilteredSchedule(res.data);
    } catch {
      message.error("Gagal memuat data jadwal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    if (selectedDay === "all") {
      setFilteredSchedule(schedule);
    } else {
      setFilteredSchedule(schedule.filter((item) => item.day === selectedDay));
    }
  }, [selectedDay, schedule]);

  const columns = [
    {
      title: "No",
      key: "no",
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: "Hari",
      dataIndex: "day",
      key: "day",
    },
    {
      title: "Jam",
      dataIndex: "time_range",
      key: "time_range",
    },
    {
      title: "Mata Pelajaran",
      dataIndex: "subject_name",
      key: "subject_name",
    },
    {
      title: "Guru Pengajar",
      dataIndex: "teacher_name",
      key: "teacher_name",
    },
    {
      title: "Ruangan",
      dataIndex: "room",
      key: "room",
    },
    {
      title: "Kelas",
      dataIndex: "class_name",
      key: "class_name",
    },
  ];

  const mobileColumns = isSmallScreen
    ? columns.filter(
        (col) => !["Kelas", "Ruangan"].includes(col.title as string),
      )
    : columns;

  return (
    <div>
      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div style={{ textAlign: "left" }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Jadwal Pelajaran
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Lihat jadwal pelajaran mingguan Anda dan informasi guru pengajar
          </Text>
        </div>
      </Flex>

      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        {" "}
        <Space>
          <Text strong>Filter Hari:</Text>
          <Select
            value={selectedDay}
            onChange={setSelectedDay}
            style={{
              flex: isSmallScreen ? "1 1 100%" : "auto",
              minWidth: 200,
            }}
            options={[
              { label: "Semua Hari", value: "all" },
              ...days.map((day) => ({ label: day, value: day })),
            ]}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSchedule}
            loading={loading}
            style={{
              backgroundColor: token.colorPrimary,
              color: token.colorTextLightSolid,
            }}
          >
            Refresh
          </Button>
        </Space>
        <Text type="secondary">
          Menampilkan {filteredSchedule.length} dari {schedule.length} jadwal
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={mobileColumns}
          dataSource={filteredSchedule}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} jadwal`,
            responsive: true,
          }}
          scroll={{ x: isSmallScreen ? 500 : undefined }}
        />
      </Spin>
    </div>
  );
};

export default StudentSchedule;
