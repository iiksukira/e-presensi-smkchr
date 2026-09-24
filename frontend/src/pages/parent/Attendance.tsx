/** @format */

import React from "react";
import { Card, Table, Tag, Row, Col, Statistic, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title } = Typography;

const Attendance: React.FC = () => {
  usePageTitle("Riwayat Presensi");

  const data = [
    { date: "2026-07-03", subject: "Pemrograman Web", status: "Hadir" },
    { date: "2026-07-02", subject: "Bahasa Indonesia", status: "Hadir" },
    { date: "2026-07-01", subject: "Matematika", status: "Izin" },
    { date: "2026-06-30", subject: "Pendidikan Agama", status: "Sakit" },
    { date: "2026-06-29", subject: "Bahasa Inggris", status: "Hadir" },
  ];

  const columns = [
    {
      title: "Tanggal",
      dataIndex: "date",
      key: "date",
      render: (value: string) => new Date(value).toLocaleDateString("id-ID"),
    },
    { title: "Mata Pelajaran", dataIndex: "subject", key: "subject" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => {
        const color =
          value === "Hadir"
            ? "green"
            : value === "Izin"
              ? "orange"
              : value === "Sakit"
                ? "blue"
                : "red";
        const icon =
          value === "Hadir" ? (
            <CheckCircleOutlined />
          ) : value === "Izin" ? (
            <ClockCircleOutlined />
          ) : (
            <CloseCircleOutlined />
          );
        return (
          <Tag color={color} icon={icon}>
            {value}
          </Tag>
        );
      },
    },
  ];

  const present = data.filter((item) => item.status === "Hadir").length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          Riwayat Presensi Anak
        </Title>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Hadir"
              value={present}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Izin"
              value={1}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Sakit"
              value={1}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="date"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Attendance;
