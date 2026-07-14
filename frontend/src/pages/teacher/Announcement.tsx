/** @format */

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
  Popconfirm,
  Flex,
  theme,
  Grid,
  Tag,
  Spin,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;
const { Option } = Select;
const { TextArea } = Input;

interface Announcement {
  id: number;
  title: string;
  content: string;
  class_id: number | null;
  class_name: string | null;
  created_at: string;
  updated_at: string;
}

interface Class {
  id: number;
  class_name: string;
  major: string;
}

interface AnnouncementFormValues {
  title: string;
  content: string;
  target_class_id?: number | null;
}

const AnnouncementTeacher: React.FC = () => {
  usePageTitle("Pengumuman");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  const isSmallScreen = !screens.md;

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get("/teacher/announcements");
      setAnnouncements(response.data);
    } catch {
      message.error("Gagal memuat pengumuman");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get("/teacher/my-classes");
      setClasses(response.data);
    } catch {
      message.error("Gagal memuat data kelas");
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchClasses();
  }, []);

  const handleSave = async (values: AnnouncementFormValues) => {
    try {
      if (editingId) {
        await api.put(`/teacher/announcement/${editingId}`, {
          title: values.title,
          content: values.content,
          target_class_id: values.target_class_id || null,
        });
        message.success("Pengumuman berhasil diperbarui");
      } else {
        await api.post("/teacher/announcement", {
          title: values.title,
          content: values.content,
          target_class_id: values.target_class_id || null,
        });
        message.success("Pengumuman berhasil dibuat");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchAnnouncements();
    } catch {
      message.error("Gagal menyimpan pengumuman");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/teacher/announcement/${id}`);
      message.success("Pengumuman berhasil dihapus");
      fetchAnnouncements();
    } catch {
      message.error("Gagal menghapus pengumuman");
    }
  };

  const handleEdit = (record: Announcement) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      target_class_id: record.class_id,
    });
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "No",
      key: "no",
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: "Judul",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Announcement) => (
        <Space>
          <Text strong>{text}</Text>
          {dayjs().diff(dayjs(record.created_at), "day") <= 1 && (
            <Tag color="green">BARU</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Konten",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ maxWidth: 300, display: "block" }}>
            {text.length > 80 ? `${text.substring(0, 80)}...` : text}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Target",
      key: "target",
      render: (_: unknown, record: Announcement) =>
        record.class_id ? (
          <Tag color="blue">{record.class_name}</Tag>
        ) : (
          <Tag color="green">Semua Kelas</Tag>
        ),
    },
    {
      title: "Tanggal",
      key: "date",
      render: (_: unknown, record: Announcement) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            {dayjs(record.created_at).format("DD/MM/YYYY")}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(record.created_at).format("HH:mm")}
          </Text>
        </Space>
      ),
      sorter: (a: Announcement, b: Announcement) =>
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: "Aksi",
      key: "action",
      fixed: isSmallScreen ? undefined : ("right" as const),
      render: (_: unknown, record: Announcement) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: token.colorWarning }}
            />
          </Tooltip>
          <Popconfirm
            title="Hapus Pengumuman"
            description="Apakah Anda yakin ingin menghapus pengumuman ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Tooltip title="Hapus">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div style={{ textAlign: "left" }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Pengumuman
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola pengumuman untuk siswa Anda
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAnnouncements}
            loading={loading}
          >
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Buat
          </Button>
        </Space>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={announcements}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} pengumuman`,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: isSmallScreen ? 900 : undefined }}
        />
      </Spin>

      {}
      <Modal
        title={
          <Space>
            {editingId ? (
              <Text strong>Edit Pengumuman</Text>
            ) : (
              <Text strong>Buat Pengumuman Baru</Text>
            )}
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="Judul Pengumuman"
            rules={[{ required: true, message: "Judul wajib diisi" }]}
          >
            <Input placeholder="Masukkan judul pengumuman" size="middle" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Konten Pengumuman"
            rules={[{ required: true, message: "Konten wajib diisi" }]}
          >
            <TextArea
              rows={6}
              placeholder="Tulis isi pengumuman di sini..."
              maxLength={3000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="target_class_id"
            label="Target Kelas (Opsional)"
            extra="Jika tidak dipilih, pengumuman akan dikirim ke semua kelas"
          >
            <Select
              placeholder="Pilih kelas target"
              allowClear
              size="middle"
              suffixIcon={<TeamOutlined />}
            >
              {classes.map((cls) => (
                <Option key={cls.id} value={cls.id}>
                  <Space>
                    <TeamOutlined />
                    {cls.class_name}
                    {cls.major && <Text type="secondary"> - {cls.major}</Text>}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setEditingId(null);
                }}
                size="medium"
              >
                Batal
              </Button>
              <Button type="primary" htmlType="submit" size="medium">
                {editingId ? "Perbarui" : "Terbitkan"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementTeacher;
