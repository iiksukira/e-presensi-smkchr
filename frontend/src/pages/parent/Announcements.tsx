

import React from "react";
import { Card, List, Typography, Tag } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;

const Announcements: React.FC = () => {
  usePageTitle("Pengumuman");

  const data = [
    {
      title: "Ujian Tengah Semester",
      date: "10 Juli 2026",
      priority: "Penting",
      content: "Pelaksanaan ujian tengah semester dimulai minggu depan.",
    },
    {
      title: "Libur Hari Raya",
      date: "15 Juli 2026",
      priority: "Biasa",
      content: "Sekolah akan libur selama tiga hari sesuai kalender akademik.",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          <BellOutlined /> Pengumuman Sekolah
        </Title>
      </Card>

      <Card>
        <List
          itemLayout="vertical"
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span>{item.title}</span>
                    <Tag color={item.priority === "Penting" ? "red" : "blue"}>
                      {item.priority}
                    </Tag>
                  </div>
                }
                description={<Text type="secondary">{item.date}</Text>}
              />
              <Text>{item.content}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Announcements;
