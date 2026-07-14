

import React from "react";
import { Card, Row, Col, Progress, Typography, List } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;

const Reports: React.FC = () => {
  usePageTitle("Laporan Perkembangan");

  const reportItems = [
    { title: "Nilai Matematika", percent: 84 },
    { title: "Nilai Bahasa Inggris", percent: 78 },
    { title: "Kehadiran", percent: 95 },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          <FileTextOutlined /> Laporan Perkembangan Anak
        </Title>
        <Text type="secondary">
          Ringkasan perkembangan belajar dan kehadiran siswa.
        </Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <List
              dataSource={reportItems}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <Text strong>{item.title}</Text>
                    <Progress percent={item.percent} showInfo />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card>
            <Title level={5}>Catatan Wali Kelas</Title>
            <Text>
              Anak Anda menunjukkan perkembangan yang baik dalam kegiatan
              belajar, terutama pada pelajaran produktif dan pemrograman.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
