

import React from "react";
import { Card, Form, Input, Switch, Button, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  usePageTitle("Pengaturan");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          <SettingOutlined /> Pengaturan Akun
        </Title>
        <Text type="secondary">
          Kelola preferensi akun dan notifikasi untuk orang tua.
        </Text>
      </Card>

      <Card>
        <Form layout="vertical">
          <Form.Item label="Nama Lengkap">
            <Input defaultValue="Bapak Rahmat" />
          </Form.Item>
          <Form.Item label="Email">
            <Input defaultValue="rahmat@email.com" />
          </Form.Item>
          <Form.Item label="Notifikasi via Email" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item label="Notifikasi via WhatsApp" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Button type="primary">Simpan Perubahan</Button>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
