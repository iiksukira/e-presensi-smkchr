/** @format */

import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

const StudentData: React.FC = () => {
  return (
    <div>
      <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
        Data Peserta Didik
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Halaman ini menampilkan data peserta didik yang terdaftar di sistem,
        Anda dapat melihat informasi lengkap mengenai setiap peserta didik.
      </Text>
    </div>
  );
};

export default StudentData;
