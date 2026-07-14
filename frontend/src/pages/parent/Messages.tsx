

import React from "react";
import { Card, List, Typography, Avatar, Tag } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;

const Messages: React.FC = () => {
  usePageTitle("Pesan");

  const data = [
    {
      sender: "Wali Kelas",
      subject: "Perkembangan belajar",
      preview: "Anak Anda sedang berkembang baik di kelas.",
      time: "10 menit lalu",
      unread: true,
    },
    {
      sender: "Admin Sekolah",
      subject: "Informasi kegiatan",
      preview: "Ada kegiatan orientasi minggu depan.",
      time: "1 jam lalu",
      unread: false,
    },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          <MessageOutlined /> Pesan
        </Title>
      </Card>

      <Card>
        <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={(item) => (
            <List.Item
              actions={item.unread ? [<Tag color="red">Baru</Tag>] : []}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<MessageOutlined />} />}
                title={item.sender}
                description={item.preview}
              />
              <Text type="secondary">{item.time}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Messages;
