/** @format */

import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

const TeacherData: React.FC = () => {
  return (
    <div>
      <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
        Data Guru
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Halaman ini menampilkan data guru yang terdaftar di sistem, Anda dapat
        melihat informasi lengkap mengenai setiap guru.
      </Text>
    </div>
  );
};

export default TeacherData;
