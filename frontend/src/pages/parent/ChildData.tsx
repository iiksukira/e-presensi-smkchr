

import React from "react";
import { Card, Descriptions, Row, Col, Typography, Timeline, Tag } from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;

const ChildData: React.FC = () => {
  usePageTitle("Data Anak");

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const childName = user?.childName || "Anak";
  const childClass = user?.childClass || "XII RPL 1";
  const childNIS = user?.childNIS || "-";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          Informasi Anak
        </Title>
        <Text type="secondary">
          Ringkasan data siswa yang terhubung dengan akun orang tua ini.
        </Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label="Nama Siswa">
                {childName}
              </Descriptions.Item>
              <Descriptions.Item label="NIS">{childNIS}</Descriptions.Item>
              <Descriptions.Item label="Kelas">{childClass}</Descriptions.Item>
              <Descriptions.Item label="Jurusan">
                Rekayasa Perangkat Lunak
              </Descriptions.Item>
              <Descriptions.Item label="Status">Aktif</Descriptions.Item>
              <Descriptions.Item label="Wali Kelas">
                Budi Santoso
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card>
            <Title level={5} style={{ marginBottom: 12 }}>
              <UserOutlined /> Ringkasan Perkembangan
            </Title>
            <Timeline
              items={[
                {
                  color: "green",
                  children: "Siswa aktif mengikuti kegiatan belajar",
                },
                {
                  color: "blue",
                  children: "Absensi bulan ini berada pada tingkat baik",
                },
                {
                  color: "orange",
                  children:
                    "Ada satu kegiatan ekstrakurikuler yang sedang berjalan",
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Title level={5} style={{ marginBottom: 12 }}>
              <BookOutlined /> Mata Pelajaran Favorit
            </Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Tag color="blue">Pemrograman Web</Tag>
              <Tag color="green">Matematika</Tag>
              <Tag color="purple">Bahasa Inggris</Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Title level={5} style={{ marginBottom: 12 }}>
              <CalendarOutlined /> Kegiatan Mendatang
            </Title>
            <div style={{ display: "grid", gap: 8 }}>
              <Text>
                <CheckCircleOutlined
                  style={{ color: "#52c41a", marginRight: 8 }}
                />
                Praktik kerja kelompok pada 05 Juli 2026
              </Text>
              <Text>
                <CheckCircleOutlined
                  style={{ color: "#52c41a", marginRight: 8 }}
                />
                Ujian tengah semester pada 15 Juli 2026
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChildData;
