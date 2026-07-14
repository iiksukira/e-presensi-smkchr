

import React from "react";
import { Card, Descriptions, Avatar, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  usePageTitle("Profil Saya");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          Profil Orang Tua
        </Title>
        <Text type="secondary">Informasi akun orang tua yang terdaftar.</Text>
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <Avatar size={64} icon={<UserOutlined />} />
          <div>
            <Title level={5} style={{ marginBottom: 4 }}>
              Bapak Rahmat
            </Title>
            <Text type="secondary">Orang Tua Siswa</Text>
          </div>
        </div>

        <Descriptions bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="Nama Lengkap">
            Bapak Rahmat
          </Descriptions.Item>
          <Descriptions.Item label="Email">rahmat@email.com</Descriptions.Item>
          <Descriptions.Item label="Nomor Telepon">
            081234567890
          </Descriptions.Item>
          <Descriptions.Item label="Hubungan">Ayah</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Profile;
