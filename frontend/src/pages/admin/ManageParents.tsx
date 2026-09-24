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
  theme,
  Flex,
  Grid,
  Tag,
  Spin,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";
import { generateUsername } from "../../utils/usernameGenerator";
import { generatePassword } from "../../utils/passwordGenerator";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Parent {
  id: number;
  full_name: string;
  phone: string;
  student_id: number;
  student_name: string;
  username: string;
  password_plain?: string;
  plaintext_password?: string;
}

interface Student {
  id: number;
  full_name: string;
  class_name: string;
}

const ManageParents: React.FC = () => {
  usePageTitle("Kelola Orang Tua");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [plaintextPasswords, setPlaintextPasswords] = useState<{
    [key: number]: string;
  }>({});
  const [, setGeneratedPassword] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [filterHasPhone, setFilterHasPhone] = useState<boolean | null>(null);

  const isSmallScreen = !screens.md;

  const loadPlaintextPasswords = () => {
    const stored = sessionStorage.getItem("parentPasswords");
    if (stored) {
      try {
        setPlaintextPasswords(JSON.parse(stored));
      } catch (e) {}
    }
  };

  const savePlaintextPassword = (id: number, password: string) => {
    setPlaintextPasswords((prev) => {
      const updated = { ...prev, [id]: password };
      sessionStorage.setItem("parentPasswords", JSON.stringify(updated));
      return updated;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resParents, resStudents] = await Promise.all([
        api.get("/admin/parents"),
        api.get("/admin/students"),
      ]);
      setParents(resParents.data);
      setFilteredParents(resParents.data);
      setStudents(resStudents.data);
      loadPlaintextPasswords();
    } catch (err) {
      message.error("Gagal memuat data Orang Tua");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...parents];

    if (searchText) {
      filtered = filtered.filter((parent) =>
        Object.values(parent).some((value) =>
          String(value).toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    }

    if (filterHasPhone !== null) {
      filtered = filtered.filter((parent) => {
        if (filterHasPhone) return parent.phone && parent.phone.trim() !== "";
        return !parent.phone || parent.phone.trim() === "";
      });
    }

    setFilteredParents(filtered);
  }, [searchText, filterHasPhone, parents]);

  useEffect(() => {
    loadPlaintextPasswords();
    fetchData();
  }, []);

  const handleSave = async (values: any) => {
    try {
      if (editingId) {
        const response = await api.put(`/admin/parents/${editingId}`, values);
        if (response.data.plaintext_password) {
          savePlaintextPassword(editingId, response.data.plaintext_password);
        }
        message.success("Data berhasil diperbarui");
      } else {
        const response = await api.post("/admin/parents", values);
        if (response.data.plaintext_password && response.data.id) {
          savePlaintextPassword(
            response.data.id,
            response.data.plaintext_password,
          );
        }
        message.success("Orang tua berhasil didaftarkan");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setGeneratedPassword(newPassword);
    form.setFieldValue("password", newPassword);
    message.success("Password berhasil di-generate");
  };

  const handleGenerateUsername = () => {
    const fullName = form.getFieldValue("full_name");
    if (!fullName || fullName.trim() === "") {
      message.warning("Harap isi nama lengkap terlebih dahulu");
      return;
    }
    const newUsername = generateUsername(fullName);
    form.setFieldValue("username", newUsername);
    message.success("Username berhasil di-generate");
  };

  const handleDelete = async (userId: number) => {
    try {
      await api.delete(`/admin/parents/${userId}`);
      message.success("Orang tua berhasil dihapus");
      setPlaintextPasswords((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        sessionStorage.setItem("parentPasswords", JSON.stringify(updated));
        return updated;
      });
      fetchData();
    } catch (err) {
      message.error("Gagal menghapus data");
    }
  };

  const columns = [
    {
      title: "Nama Orang Tua",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "No. WhatsApp",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => (
        <span style={{ fontFamily: "monospace" }}>
          {phone || <Tag color="warning">Tidak diisi</Tag>}
        </span>
      ),
    },
    {
      title: "Nama Anak (Siswa)",
      dataIndex: "student_name",
      key: "student_name",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (username: string) => (
        <Space>
          <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>
            {username}
          </span>
        </Space>
      ),
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
      render: (_: any, record: Parent) => {
        const password =
          plaintextPasswords[record.id] ||
          record.password_plain ||
          record.plaintext_password;

        return (
          <Space>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: "bold",
                color: password ? token.colorText : token.colorError,
              }}
            >
              {password || "-"}
            </span>
          </Space>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      render: (_: any, record: Parent) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingId(record.id);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
            style={{ color: token.colorPrimary }}
          />
          <Popconfirm
            title="Hapus data ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
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
          <Title
            level={4}
            style={{
              margin: 0,
              fontWeight: 700,
            }}
          >
            Manajemen Orang Tua
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola data orang tua, termasuk penambahan, pengeditan, dan
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
            icon={<UserAddOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            size="medium"
            style={{
              backgroundColor: token.colorPrimary,
              borderColor: token.colorPrimary,
            }}
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
            placeholder="Cari nama orang tua, nomor WhatsApp, atau nama siswa..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 150, minWidth: 200 }}
            allowClear
          />
          <Select
            placeholder="Filter WhatsApp"
            value={filterHasPhone}
            onChange={setFilterHasPhone}
            allowClear
            style={{ width: "100%" }}
            options={[
              { label: "Memiliki WhatsApp", value: true },
              { label: "Tidak Ada WhatsApp", value: false },
            ]}
          />
        </Space>
        <Text type="secondary">
          Menampilkan {filteredParents.length} dari {parents.length} orang tua
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredParents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} orang tua`,
          }}
          scroll={{ x: "max-content" }}
        />
      </Spin>

      {}
      <Modal
        title={editingId ? "Edit Data Orang Tua" : "Tambah Orang Tua Baru"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Simpan"
        cancelText="Batal"
        okButtonProps={{
          style: {
            backgroundColor: token.colorPrimary,
            borderColor: token.colorPrimary,
          },
        }}
        destroyOnClose
        width={isSmallScreen ? "90%" : 600}
        style={{ maxWidth: 600, margin: "0 auto" }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="full_name"
            label="Nama Lengkap Orang Tua"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input placeholder="Contoh: Bapak/Ibu Ahmad" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Nomor WhatsApp"
            rules={[
              {
                required: true,
                min: 10,
                message: "Nomor WhatsApp wajib diisi (minimal 10 digit)",
              },
            ]}
          >
            <Input placeholder="628xxxxxxxxxxxx" />
          </Form.Item>
          <Form.Item
            name="student_id"
            label="Pilih Anak (Siswa)"
            rules={[{ required: true, message: "Pilih anak yang sesuai" }]}
          >
            <Select
              showSearch
              placeholder="Cari nama siswa"
              optionFilterProp="children"
            >
              {students.map((s: Student) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.full_name} ({s.class_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Username wajib diisi" }]}
          >
            <Input
              placeholder="klik tombol Generate untuk username otomatis"
              suffix={
                <Button
                  type="text"
                  size="small"
                  onClick={handleGenerateUsername}
                  title="Generate username otomatis"
                  style={{ color: token.colorPrimary }}
                >
                  Generate
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={
              editingId
                ? []
                : [{ required: true, min: 6, message: "Minimal 6 karakter" }]
            }
            extra={
              editingId
                ? "Kosongkan jika tidak ingin merubah password"
                : undefined
            }
          >
            <Input.Password
              placeholder="Atau klik tombol Generate untuk password otomatis"
              suffix={
                <Button
                  type="text"
                  size="small"
                  onClick={handleGeneratePassword}
                  title="Generate password otomatis"
                  style={{ color: token.colorPrimary }}
                >
                  Generate
                </Button>
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageParents;
