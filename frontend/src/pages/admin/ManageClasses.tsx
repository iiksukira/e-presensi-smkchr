

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
  theme,
  Flex,
  Grid,
  Tooltip,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  BookOutlined,
} from "@ant-design/icons";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Teacher {
  id: number;
  full_name: string;
  nip: string;
}

interface ClassData {
  id: number;
  class_name: string;
  major: string;
  homeroom_teacher_id: number | null;
  homeroom_teacher_name?: string;
  teacher_nip?: string;
}

const ManageClasses: React.FC = () => {
  usePageTitle("Kelola Kelas & Jurusan");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterMajor, setFilterMajor] = useState<string | null>(null);

  const isSmallScreen = !screens.md;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/classes");
      setClasses(res.data);
      setFilteredClasses(res.data);
    } catch (err) {
      message.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async () => {
    try {
      const res = await api.get("/admin/majors");
      setMajors(res.data);
    } catch (err) {
      message.error("Gagal memuat data jurusan");
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/admin/teachers");
      setTeachers(res.data);
    } catch (err) {
    }
  };

  useEffect(() => {
    let filtered = [...classes];

    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.class_name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.major.toLowerCase().includes(searchText.toLowerCase()) ||
          (item.homeroom_teacher_name || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()),
      );
    }

    if (filterMajor) {
      filtered = filtered.filter((item) => item.major === filterMajor);
    }

    setFilteredClasses(filtered);
  }, [searchText, filterMajor, classes]);

  useEffect(() => {
    fetchData();
    fetchMajors();
    fetchTeachers();
  }, []);

  const handleSave = async (values: any) => {
    try {
      if (editingId !== null) {
        await api.put(`/admin/classes/${editingId}`, values);
        message.success("Data kelas berhasil diperbarui");
      } else {
        await api.post("/admin/classes", values);
        message.success("Kelas baru berhasil ditambahkan");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchData();
      fetchMajors();
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Gagal menyimpan data kelas",
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/classes/${id}`);
      message.success("Kelas berhasil dihapus");
      fetchData();
    } catch (err: any) {
      message.error(
        err.response?.data?.message ||
          "Gagal menghapus kelas (Mungkin masih ada siswa di kelas ini)",
      );
    }
  };

  const columns: ColumnsType<ClassData> = [
    {
      title: "No",
      key: "no",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Nama Kelas",
      dataIndex: "class_name",
      key: "class_name",
      width: 180,
      render: (name: string) => <Text strong>{name}</Text>,
      sorter: (a: ClassData, b: ClassData) =>
        (a.class_name || "").localeCompare(b.class_name || ""),
    },
    {
      title: "Jurusan",
      dataIndex: "major",
      key: "major",
      width: 200,
      filters: majors.map((m) => ({ text: m, value: m })),
      onFilter: (value: any, record: ClassData) => record.major === value,
    },
    {
      title: "Wali Kelas",
      key: "homeroom_teacher",
      width: 250,
      render: (_: any, record: ClassData) => {
        if (record.homeroom_teacher_id && record.homeroom_teacher_name) {
          return (
            <div>
              <Text strong>{record.homeroom_teacher_name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                NIP: {record.teacher_nip || "-"}
              </Text>
            </div>
          );
        }
        return <Text> Belum ditentukan</Text>;
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 120,
      fixed: isSmallScreen ? undefined : ("right" as const),
      render: (_: any, record: ClassData) => (
        <Space>
          <Tooltip title="Edit Kelas">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingId(record.id);
                form.setFieldsValue({
                  class_name: record.class_name,
                  major: record.major,
                  homeroom_teacher_id: record.homeroom_teacher_id,
                });
                setIsModalVisible(true);
              }}
              style={{ color: token.colorPrimary }}
            />
          </Tooltip>
          <Popconfirm
            title="Hapus kelas ini?"
            description={`Apakah Anda yakin ingin menghapus kelas "${record.class_name}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Tooltip title="Hapus Kelas">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ textAlign: "left" }}>
      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Manajemen Kelas & Jurusan
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola data kelas dan jurusan, termasuk penambahan, pengeditan, dan
            penghapusan
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            size="medium"
          >
            Tambah
          </Button>
        </Space>
      </Flex>

      {}
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <Space wrap>
          <Input
            placeholder="Cari nama kelas, jurusan, atau wali kelas..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 150, minWidth: 200 }}
            allowClear
          />
          <Select
            placeholder="Filter Jurusan"
            value={filterMajor}
            onChange={setFilterMajor}
            allowClear
            style={{ width: "100%" }}
            options={majors.map((major) => ({
              label: major,
              value: major,
            }))}
          />
        </Space>
        <Text type="secondary">
          Menampilkan {filteredClasses.length} dari {classes.length} kelas
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredClasses}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} kelas`,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: "max-content" }}
        />
      </Spin>

      {}
      <Modal
        title={
          <Space>
            {editingId ? <EditOutlined /> : <PlusOutlined />}
            <Text strong>
              {editingId ? "Edit Data Kelas" : "Tambah Kelas Baru"}
            </Text>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={isSmallScreen ? "90%" : 550}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="class_name"
            label="Nama Kelas"
            rules={[{ required: true, message: "Nama kelas wajib diisi" }]}
          >
            <Input
              placeholder="Contoh: X PH, XI MP, XII TSM"
              size="medium"
              prefix={<BookOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="major"
            label="Jurusan"
            rules={[{ required: true, message: "Pilih jurusan" }]}
          >
            <Select
              placeholder="Pilih jurusan"
              size="medium"
              showSearch
              optionFilterProp="label"
              options={majors.map((major) => ({
                label: major,
                value: major,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="homeroom_teacher_id"
            label="Wali Kelas"
            extra="Pilih guru yang akan menjadi wali kelas (opsional)"
          >
            <Select
              placeholder="Pilih wali kelas"
              size="medium"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {teachers.map((teacher) => (
                <Select.Option key={teacher.id} value={teacher.id}>
                  <Space>
                    <UserOutlined />
                    {teacher.full_name}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      - {teacher.nip}
                    </Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Flex justify="end" gap={8}>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingId(null);
                  form.resetFields();
                }}
                size="medium"
              >
                Batal
              </Button>
              <Button type="primary" htmlType="submit" size="medium">
                {editingId ? "Simpan Perubahan" : "Tambah Kelas"}
              </Button>
            </Flex>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageClasses;
