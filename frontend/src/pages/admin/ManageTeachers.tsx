/** @format */

import React, { useEffect, useState } from "react";
import {
  Alert,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  message,
  Popconfirm,
  Tag,
  Select,
  theme,
  Flex,
  Grid,
  Upload,
  Progress,
  Spin,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ImportOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import * as XLSX from "xlsx";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";
import { generateUsername } from "../../utils/usernameGenerator";
import { generatePassword } from "../../utils/passwordGenerator";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Teacher {
  id?: number;
  teacher_id?: number;
  nip: string;
  full_name: string;
  username: string;
  face_data: boolean;
  password_plain?: string;
  plaintext_password?: string;
  user_id?: number;
}

interface ImportResult {
  success: Teacher[];
  failed: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

const ManageTeachers: React.FC = () => {
  usePageTitle("Kelola Guru");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [plaintextPasswords, setPlaintextPasswords] = useState<{
    [key: number]: string;
  }>({});
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const isSmallScreen = !screens.md;

  const loadPlaintextPasswords = () => {
    const stored = sessionStorage.getItem("teacherPasswords");
    if (stored) {
      try {
        setPlaintextPasswords(JSON.parse(stored));
      } catch (e) {}
    }
  };

  const savePlaintextPassword = (id: number, password: string) => {
    setPlaintextPasswords((prev) => {
      const updated = { ...prev, [id]: password };
      sessionStorage.setItem("teacherPasswords", JSON.stringify(updated));
      return updated;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/teachers");
      setTeachers(res.data);
      setFilteredTeachers(res.data);
      loadPlaintextPasswords();
    } catch (err) {
      message.error("Gagal memuat data guru");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...teachers];

    if (searchText) {
      filtered = filtered.filter((teacher) =>
        Object.values(teacher).some((value) =>
          String(value).toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((teacher) => {
        if (filterStatus === "registered") return teacher.face_data;
        if (filterStatus === "unregistered") return !teacher.face_data;
        return true;
      });
    }

    setFilteredTeachers(filtered);
  }, [searchText, filterStatus, teachers]);

  useEffect(() => {
    loadPlaintextPasswords();
    fetchData();
  }, []);

  const handleEditClick = (record: Teacher) => {
    setEditingId(record.teacher_id || record.id || 0);
    setSelectedTeacher(record);

    form.setFieldsValue({
      full_name: record.full_name,
      nip: record.nip,
      username: record.username,
      password: "",
    });

    setIsModalVisible(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setSelectedTeacher(null);

    form.resetFields();

    setIsModalVisible(true);
  };

  const handleSave = async (values: any) => {
    const isEditMode = editingId !== null || selectedTeacher !== null;

    try {
      let response;
      if (isEditMode) {
        const teacherId =
          selectedTeacher?.teacher_id || selectedTeacher?.id || editingId;

        const updateData: any = {
          full_name: values.full_name,
        };

        if (values.username !== selectedTeacher?.username) {
          updateData.username = values.username;
        }

        if (values.nip !== selectedTeacher?.nip) {
          updateData.nip = values.nip;
        }

        if (values.password && values.password.trim() !== "") {
          updateData.password = values.password;
        }

        response = await api.put(`/admin/teachers/${teacherId}`, updateData);
        message.success("Data guru berhasil diperbarui");

        const updatedTeacher = response.data || {};
        const responseId =
          updatedTeacher.user_id ||
          updatedTeacher.teacher_id ||
          updatedTeacher.id;

        const saveId = responseId || teacherId;

        if (
          values.password &&
          values.password.trim() !== "" &&
          saveId != null
        ) {
          savePlaintextPassword(saveId, values.password);
        }
      } else {
        if (!values.password || values.password.trim() === "") {
          message.error("Password wajib diisi untuk guru baru");
          return;
        }

        const duplicateUsername = teachers.find(
          (t) => t.username === values.username,
        );
        const duplicateNip = teachers.find((t) => t.nip === values.nip);

        if (duplicateUsername) {
          message.error(
            "Username sudah digunakan oleh guru lain. Harap gunakan username berbeda atau regenerate username.",
          );
          return;
        }

        if (duplicateNip) {
          message.error(
            "NIP sudah digunakan oleh guru lain. Harap gunakan NIP berbeda.",
          );
          return;
        }

        response = await api.post("/admin/teachers", values);
        message.success("Guru baru berhasil ditambahkan");

        const newTeacher = response.data;
        const targetId = newTeacher.id || newTeacher.user_id;
        if (targetId) {
          if (newTeacher.plaintext_password) {
            savePlaintextPassword(targetId, newTeacher.plaintext_password);
          } else if (values.password) {
            savePlaintextPassword(targetId, values.password);
          }
        }
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      setSelectedTeacher(null);
      fetchData();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal menyimpan data";

      if (errorMessage.includes("username") && errorMessage.includes("sudah")) {
        message.error(
          "Username sudah digunakan oleh guru lain. Silakan gunakan username yang berbeda.",
        );
      } else if (
        errorMessage.includes("NIP") &&
        errorMessage.includes("sudah")
      ) {
        message.error(
          "NIP sudah digunakan oleh guru lain. Silakan gunakan NIP yang berbeda.",
        );
      } else {
        message.error(errorMessage);
      }
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await api.delete(`/admin/teachers/${userId}`);
      message.success("Guru berhasil dihapus");
      setPlaintextPasswords((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        sessionStorage.setItem("teacherPasswords", JSON.stringify(updated));
        return updated;
      });
      fetchData();
    } catch (err) {
      message.error("Gagal menghapus data");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await api.delete("/admin/teachers");
      sessionStorage.removeItem("teacherPasswords");
      setPlaintextPasswords({});
      message.success(response.data?.message || "Semua guru berhasil dihapus");
      await fetchData();
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Gagal menghapus semua guru",
      );
    }
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

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setFieldValue("password", newPassword);
    message.success("Password berhasil di-generate");
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingId(null);
    setSelectedTeacher(null);
    form.resetFields();
  };

  const validateUsername = async (_: any, value: string) => {
    if (!value) {
      return Promise.reject("Username wajib diisi");
    }

    const existingTeacher = teachers.find(
      (teacher) =>
        teacher.username === value &&
        (teacher.teacher_id || teacher.id) !== editingId,
    );

    if (existingTeacher) {
      return Promise.reject("Username sudah digunakan oleh guru lain");
    }

    return Promise.resolve();
  };

  const validateNip = async (_: any, value: string) => {
    if (!value) {
      return Promise.reject("NIP wajib diisi");
    }

    const existingTeacher = teachers.find(
      (teacher) =>
        teacher.nip === value &&
        (teacher.teacher_id || teacher.id) !== editingId,
    );

    if (existingTeacher) {
      return Promise.reject("NIP sudah digunakan oleh guru lain");
    }

    return Promise.resolve();
  };

  const downloadTemplate = () => {
    const template = [
      {
        NUPTK: "1234567890",
        "Nama Lengkap": "Budi Santoso, S.Pd",
        Username: "budi.santoso",
        Password: "password123",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    ws["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }];

    XLSX.writeFile(wb, "template_import_guru.xlsx");
  };

  const uploadProps: UploadProps = {
    name: "file",
    accept: ".xlsx,.xls,.csv",
    fileList: fileList,
    beforeUpload: (file) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("File harus lebih kecil dari 5MB!");
        return false;
      }

      setFileError(null);

      setFileList([
        {
          uid: file.uid,
          name: file.name,
          status: "done",
          originFileObj: file,
        },
      ]);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setFileError("File tidak mengandung data");
            message.warning("File tidak mengandung data");
            return;
          }

          const validatedData = jsonData.map((row: any, index: any) => {
            const normalizedRow = Object.entries(row).reduce(
              (acc: any, [key, value]) => {
                const normalizedKey = key?.toString().trim().toLowerCase();
                if (normalizedKey) {
                  acc[normalizedKey] = value;
                }
                return acc;
              },
              {},
            );

            const nip = normalizedRow["nuptk"]
              ? String(normalizedRow["nuptk"]).trim()
              : normalizedRow["nip"]
                ? String(normalizedRow["nip"]).trim()
                : "";
            const fullName = normalizedRow["nama lengkap"]
              ? String(normalizedRow["nama lengkap"]).trim()
              : "";
            const username = normalizedRow["username"]
              ? String(normalizedRow["username"]).trim()
              : "";
            const password = normalizedRow["password"]
              ? String(normalizedRow["password"]).trim()
              : "";

            const errors: string[] = [];
            if (!nip) errors.push("NIP/NUPTK wajib diisi");
            if (!fullName) errors.push("Nama Lengkap wajib diisi");

            if (nip) {
              const existingTeacher = teachers.find((t) => t.nip === nip);
              if (existingTeacher) {
                errors.push(`NIP/NUPTK "${nip}" sudah terdaftar`);
              }
            }

            if (username) {
              const existingUsername = teachers.find(
                (t) => t.username === username,
              );
              if (existingUsername) {
                errors.push(`Username "${username}" sudah digunakan`);
              }
            }

            return {
              row: index + 1,
              data: {
                NIP: nip,
                "Nama Lengkap": fullName,
                Username: username,
                Password: password,
              },
              errors,
              isValid: errors.length === 0,
            };
          });

          setPreviewData(validatedData);

          const validCount = validatedData.filter(
            (item: any) => item.isValid,
          ).length;
          const invalidCount = validatedData.filter(
            (item: any) => !item.isValid,
          ).length;

          if (validCount === 0 && invalidCount > 0) {
            setFileError(
              "Tidak ada data yang valid. Periksa format data dan nama kolom.",
            );
            message.warning(
              "Tidak ada data yang valid untuk diimport. Periksa format data.",
            );
          } else {
            message.success(
              `${validCount} data valid, ${invalidCount} data bermasalah`,
            );
          }
        } catch (error) {
          setFileError("Gagal membaca file. Pastikan format file benar.");
          message.error("Gagal membaca file. Pastikan format file benar.");
        }
      };

      reader.readAsArrayBuffer(file);

      return false;
    },
    onRemove: () => {
      setFileList([]);
      setPreviewData([]);
      setImportResult(null);
      setFileError(null);
    },
    maxCount: 1,
  };

  const handleImport = async () => {
    const validData = previewData.filter((item) => item.isValid);

    if (validData.length === 0) {
      message.warning("Tidak ada data valid untuk diimport");
      return;
    }

    setImportLoading(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const importData = validData.map((item) => {
        let username = item.data["Username"]
          ? String(item.data["Username"]).trim()
          : "";
        if (!username) {
          username = generateUsername(String(item.data["Nama Lengkap"]));
        }

        let password = item.data["Password"]
          ? String(item.data["Password"]).trim()
          : "";
        if (!password) {
          password = generatePassword();
        }

        return {
          nip: String(item.data["NIP"]).trim(),
          full_name: String(item.data["Nama Lengkap"]).trim(),
          username: username,
          password: password,
        };
      });

      const response = await api.post("/admin/teachers/import", {
        teachers: importData,
      });

      const result: ImportResult = response.data;
      setImportResult(result);

      result.success.forEach((teacher) => {
        if (teacher.plaintext_password && teacher.id) {
          savePlaintextPassword(teacher.id, teacher.plaintext_password);
        }
      });

      if (result.failedCount === 0) {
        message.success(`Berhasil mengimport ${result.successCount} guru`);
      } else {
        message.warning(
          `Berhasil import ${result.successCount} guru, ${result.failedCount} gagal`,
        );
      }

      await fetchData();

      setTimeout(() => {
        setIsImportModalVisible(false);
        setImportResult(null);
        setPreviewData([]);
        setFileList([]);
        setImportProgress(0);
      }, 3000);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengimport data guru",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const renderImportPreview = () => {
    if (fileError && previewData.length === 0) {
      return (
        <Alert
          type="warning"
          message={fileError}
          showIcon
          style={{ marginTop: 16 }}
        />
      );
    }

    if (previewData.length === 0) return null;

    const previewColumns = [
      { title: "Baris", dataIndex: "row", key: "row", width: 70 },
      {
        title: "NIP/NUPTK",
        key: "nip",
        render: (_: any, record: any) => record.data["NIP"],
      },
      {
        title: "Nama Lengkap",
        key: "full_name",
        render: (_: any, record: any) => record.data["Nama Lengkap"],
      },
      {
        title: "Username",
        key: "username",
        render: (_: any, record: any) => record.data["Username"],
      },
      {
        title: "Status",
        key: "status",
        render: (_: any, record: any) =>
          record.isValid ? (
            <Tag color="success">Valid</Tag>
          ) : (
            <Tag color="error">Salah</Tag>
          ),
      },
      {
        title: "Kesalahan",
        key: "errors",
        render: (_: any, record: any) => record.errors.join(", "),
      },
    ];

    return (
      <div style={{ marginTop: 16 }}>
        <Alert
          type={
            previewData.some((item) => !item.isValid) ? "warning" : "success"
          }
          message={`Preview import: ${previewData.filter((item) => item.isValid).length} valid, ${previewData.filter((item) => !item.isValid).length} bermasalah`}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={previewData}
          columns={previewColumns}
          rowKey="row"
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </div>
    );
  };

  const renderImportResult = () => {
    if (!importResult) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <Alert
          type={importResult.failedCount > 0 ? "warning" : "success"}
          message={`Import selesai: ${importResult.successCount} berhasil, ${importResult.failedCount} gagal`}
          showIcon
          style={{ marginBottom: 16 }}
        />
        {importResult.failedCount > 0 && (
          <Table
            dataSource={importResult.failed}
            rowKey="row"
            pagination={false}
            scroll={{ x: "max-content" }}
            columns={[
              { title: "Baris", dataIndex: "row", key: "row", width: 70 },
              {
                title: "NIP/NUPTK",
                dataIndex: ["data", "NIP"],
                key: "nip",
              },
              {
                title: "Nama Lengkap",
                dataIndex: ["data", "Nama Lengkap"],
                key: "full_name",
              },
              {
                title: "Kesalahan",
                dataIndex: "error",
                key: "error",
              },
            ]}
          />
        )}
      </div>
    );
  };

  const columns = [
    {
      title: "NUPTK/NIP",
      dataIndex: "nip",
      key: "nip",
    },
    {
      title: "Nama Lengkap",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Status Wajah",
      dataIndex: "face_data",
      key: "face_data",
      render: (face: boolean) =>
        face ? (
          <Tag color="success">Terdaftar</Tag>
        ) : (
          <Tag color="warning">Belum Daftar</Tag>
        ),
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
      render: (_: any, record: Teacher) => {
        const password =
          plaintextPasswords[
            record.user_id || record.teacher_id || record.id || 0
          ] ||
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
      render: (_: any, record: Teacher) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
            style={{ color: token.colorPrimary }}
          />
          <Popconfirm
            title="Hapus guru ini?"
            description="Data yang dihapus tidak dapat dikembalikan!"
            onConfirm={() =>
              handleDelete(
                record.user_id || record.teacher_id || record.id || 0,
              )
            }
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
            Manajemen Akun Guru
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola data akun guru, termasuk penambahan, pengeditan, dan
            penghapusan
          </Text>
        </div>
        <Space wrap>
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
            onClick={handleAddClick}
            style={{
              backgroundColor: token.colorPrimary,
              borderColor: token.colorPrimary,
            }}
          >
            Tambah
          </Button>
          <Button
            type="primary"
            icon={<ImportOutlined />}
            onClick={() => {
              setIsImportModalVisible(true);
              setImportResult(null);
              setPreviewData([]);
              setFileList([]);
              setImportProgress(0);
            }}
            style={{
              backgroundColor: token.colorPrimary,
              borderColor: token.colorPrimary,
            }}
          >
            Import
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
            placeholder="Cari nama, NIP, atau username guru..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Filter Status Wajah"
            value={filterStatus}
            onChange={setFilterStatus}
            allowClear
            options={[
              { label: "Terdaftar", value: "registered" },
              { label: "Belum Daftar", value: "unregistered" },
            ]}
          />
          <Popconfirm
            title="Hapus semua guru?"
            description="Yakin ingin menghapus semua data guru?"
            onConfirm={handleDeleteAll}
            okText="Ya, hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={teachers.length === 0 || loading}
            ></Button>
          </Popconfirm>
        </Space>
        <Text type="secondary">
          Menampilkan {filteredTeachers.length} dari {teachers.length} guru
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredTeachers}
          rowKey={(record) =>
            `${record.teacher_id || record.id || record.user_id}`
          }
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} guru`,
          }}
          scroll={{ x: "max-content" }}
        />
      </Spin>
      {}
      <Modal
        title={
          editingId !== null ? (
            <Space>
              <EditOutlined style={{ color: token.colorPrimary }} />
              <Text strong>Edit Data Guru</Text>
            </Space>
          ) : (
            <Space>
              <UserAddOutlined style={{ color: token.colorPrimary }} />
              <Text strong>Tambah Guru Baru</Text>
            </Space>
          )
        }
        open={isModalVisible}
        onCancel={handleModalCancel}
        onOk={() => form.submit()}
        okText="Simpan"
        cancelText="Batal"
        okButtonProps={{
          style: {
            backgroundColor: token.colorPrimary,
            borderColor: token.colorPrimary,
          },
        }}
        destroyOnHidden
        width={isSmallScreen ? "90%" : 600}
        style={{ maxWidth: 600, margin: "0 auto" }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="full_name"
            label="Nama Lengkap & Gelar"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input placeholder="Contoh: Budi Santoso, S.Pd" size="large" />
          </Form.Item>

          <Form.Item
            name="nip"
            label="NIP"
            rules={[
              { required: true, message: "NIP wajib diisi" },
              { validator: validateNip },
            ]}
          >
            <Input placeholder="Nomor Induk Pegawai" size="large" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: "Username wajib diisi" },
              { validator: validateUsername },
            ]}
          >
            <Input
              placeholder="klik tombol Generate untuk username otomatis"
              suffix={
                <Button
                  type="text"
                  size="middle"
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
              editingId === null
                ? [{ required: true, min: 6, message: "Minimal 6 karakter" }]
                : []
            }
          >
            <Input.Password
              placeholder={
                editingId !== null
                  ? "Kosongkan jika tidak ingin merubah password"
                  : "Atau klik tombol Generate untuk password otomatis"
              }
              size="large"
              suffix={
                <Button
                  type="text"
                  size="middle"
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

      {}
      <Modal
        title="Import Data Guru"
        open={isImportModalVisible}
        onCancel={() => {
          setIsImportModalVisible(false);
          setImportResult(null);
          setPreviewData([]);
          setFileList([]);
          setImportProgress(0);
        }}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
          >
            Download Template
          </Button>,
          <Button
            key="import"
            type="primary"
            icon={<UploadOutlined />}
            loading={importLoading}
            disabled={
              !previewData.some((item) => item.isValid) || importLoading
            }
            onClick={handleImport}
          >
            Import Data
          </Button>,
        ]}
        width={800}
        destroyOnHidden
      >
        <Upload.Dragger
          {...uploadProps}
          disabled={importLoading || !!importResult}
        >
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined />
          </p>
          <p className="ant-upload-text">Klik atau drag file Excel ke sini</p>
          <p className="ant-upload-hint">
            Support file .xlsx, .xls, .csv (Max 5MB)
          </p>
        </Upload.Dragger>

        {renderImportPreview()}
        {importLoading && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={importProgress} status="active" />
          </div>
        )}
        {renderImportResult()}
      </Modal>
    </div>
  );
};

export default ManageTeachers;
