

import React from "react";
import { Card, Table, Tag, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title } = Typography;

const Schedule: React.FC = () => {
  usePageTitle("Jadwal Pelajaran");

  const data = [
    {
      day: "Senin",
      time: "07:00 - 08:30",
      subject: "Matematika",
      room: "R-101",
    },
    {
      day: "Selasa",
      time: "08:30 - 10:00",
      subject: "Pemrograman Web",
      room: "Lab-1",
    },
    {
      day: "Rabu",
      time: "07:00 - 08:30",
      subject: "Bahasa Inggris",
      room: "R-205",
    },
    {
      day: "Kamis",
      time: "09:00 - 10:30",
      subject: "Pendidikan Agama",
      room: "R-104",
    },
    {
      day: "Jumat",
      time: "07:30 - 09:00",
      subject: "Produktif",
      room: "R-301",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          <CalendarOutlined /> Jadwal Pelajaran Anak
        </Title>
      </Card>

      <Card>
        <Table dataSource={data} rowKey="day" pagination={false}>
          <Table.Column title="Hari" dataIndex="day" key="day" />
          <Table.Column title="Jam" dataIndex="time" key="time" />
          <Table.Column
            title="Mata Pelajaran"
            dataIndex="subject"
            key="subject"
            render={(value: string) => <Tag color="blue">{value}</Tag>}
          />
          <Table.Column title="Ruangan" dataIndex="room" key="room" />
        </Table>
      </Card>
    </div>
  );
};

export default Schedule;
