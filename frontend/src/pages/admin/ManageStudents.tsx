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
  Tag,
  Alert,
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
import { generatePassword } from "../../utils/passwordGenerator";
import { generateUsername } from "../../utils/usernameGenerator";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Student {
  id: number;
  nisn: string;
  full_name: string;
  username: string;
  class_id: number;
  class_name: string;
  face_data: boolean;
  password_plain?: string;
  plaintext_password?: string;
}

interface Class {
  id: number;
  class_name: string;
  major: string;
}

interface ImportResult {
  success: Student[];
  failed: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

const ManageStudents: React.FC = () => {
  usePageTitle("Kelola Siswa");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [, setGeneratedPassword] = useState<string>("");
  const [plaintextPasswords, setPlaintextPasswords] = useState<{
    [key: number]: string;
  }>({});
  const [searchText, setSearchText] = useState("");
  const [filterClass, setFilterClass] = useState<number | null>(null);
  const [filterFaceStatus, setFilterFaceStatus] = useState<string | null>(null);

  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const loadPlaintextPasswords = () => {
    const stored = sessionStorage.getItem("studentPasswords");
    if (stored) {
      try {
        setPlaintextPasswords(JSON.parse(stored));
      } catch (e) {}
    }
  };

  const savePlaintextPassword = (id: number, password: string) => {
    setPlaintextPasswords((prev) => {
      const updated = { ...prev, [id]: password };
      sessionStorage.setItem("studentPasswords", JSON.stringify(updated));
      return updated;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSiswa, resKelas] = await Promise.all([
        api.get("/admin/students"),
        api.get("/admin/classes"),
      ]);
      setStudents(resSiswa.data);
      setFilteredStudents(resSiswa.data);
      setClasses(resKelas.data);
      loadPlaintextPasswords();
    } catch (err) {
      message.error("Gagal memuat data siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...students];

    if (searchText) {
      filtered = filtered.filter((student) =>
        Object.values(student).some((value) =>
          String(value).toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    }

    if (filterClass) {
      filtered = filtered.filter((student) => student.class_id === filterClass);
    }

    if (filterFaceStatus) {
      filtered = filtered.filter((student) => {
        if (filterFaceStatus === "registered") return student.face_data;
        if (filterFaceStatus === "unregistered") return !student.face_data;
        return true;
      });
    }

    setFilteredStudents(filtered);
  }, [searchText, filterClass, filterFaceStatus, students]);

  useEffect(() => {
    loadPlaintextPasswords();
    fetchData();
  }, []);

  const handleSave = async (values: any) => {
    try {
      if (editingId) {
        const response = await api.put(`/admin/students/${editingId}`, values);
        if (response.data.plaintext_password) {
          savePlaintextPassword(editingId, response.data.plaintext_password);
        }
        message.success("Data siswa berhasil diperbarui");
      } else {
        const response = await api.post("/admin/students", values);
        if (response.data.plaintext_password && response.data.id) {
          savePlaintextPassword(
            response.data.id,
            response.data.plaintext_password,
          );
        }
        message.success("Siswa baru berhasil ditambahkan");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/students/${id}`);
      message.success("Siswa berhasil dihapus");
      setPlaintextPasswords((prev) => {
        const updated = { ...prev };
        delete updated[id];
        sessionStorage.setItem("studentPasswords", JSON.stringify(updated));
        return updated;
      });
      fetchData();
    } catch (err) {
      message.error("Gagal menghapus data");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await api.delete("/admin/students");
      sessionStorage.removeItem("studentPasswords");
      setPlaintextPasswords({});
      message.success(response.data?.message || "Semua siswa berhasil dihapus");
      await fetchData();
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Gagal menghapus semua siswa",
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
    setGeneratedPassword(newPassword);
    form.setFieldValue("password", newPassword);
    message.success("Password berhasil di-generate");
  };

  const downloadTemplate = () => {
    const template = [
      {
        NISN: "1234567890",
        "Nama Lengkap": "Ahmad Rahman",
        Kelas: "XII RPL 1",
        Username: "ahmad.rahman",
        Password: "password123",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    ws["!cols"] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, "template_import_siswa.xlsx");
  };

  const handleFileChange = (info: any) => {
    setFileList(info.fileList.slice(-1));
    const file = info.file.originFileObj || info.file;
    if (!(file instanceof File)) return;

    setPreviewData([]);
    setImportResult(null);
    setFileError(null);

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

        const validatedData = jsonData.map((row: any, index: number) => {
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

          const nisn = normalizedRow["nisn"]
            ? String(normalizedRow["nisn"]).trim()
            : "";
          const fullName = normalizedRow["nama lengkap"]
            ? String(normalizedRow["nama lengkap"]).trim()
            : "";
          const kelas = normalizedRow["kelas"]
            ? String(normalizedRow["kelas"]).trim()
            : "";
          const username = normalizedRow["username"]
            ? String(normalizedRow["username"]).trim()
            : "";
          const password = normalizedRow["password"]
            ? String(normalizedRow["password"]).trim()
            : "";

          const errors: string[] = [];
          if (!nisn) errors.push("NISN wajib diisi");
          if (!fullName) errors.push("Nama Lengkap wajib diisi");
          if (!kelas) errors.push("Kelas wajib diisi");

          if (kelas) {
            const classExists = classes.some(
              (c) => c.class_name.toLowerCase() === kelas.toLowerCase(),
            );
            if (!classExists) {
              errors.push(`Kelas "${kelas}" tidak ditemukan`);
            }
          }

          return {
            row: index + 1,
            data: {
              NISN: nisn,
              "Nama Lengkap": fullName,
              Kelas: kelas,
              Username: username,
              Password: password,
            },
            errors,
            isValid: errors.length === 0,
          };
        });

        setPreviewData(validatedData);

        const validCount = validatedData.filter((item) => item.isValid).length;
        const invalidCount = validatedData.filter(
          (item) => !item.isValid,
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
      return false;
    },
    onChange: handleFileChange,
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
        const classMatch = classes.find(
          (c) =>
            c.class_name.toLowerCase() ===
            String(item.data["Kelas"]).toLowerCase(),
        );

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
          nisn: String(item.data["NISN"]).trim(),
          full_name: String(item.data["Nama Lengkap"]).trim(),
          class_id: classMatch?.id || 0,
          username: username,
          password: password,
        };
      });

      const response = await api.post("/admin/students/import", {
        students: importData,
      });

      const result: ImportResult = response.data;
      setImportResult(result);

      if (result.failedCount === 0) {
        message.success(`Berhasil mengimport ${result.successCount} siswa`);
      } else {
        message.warning(
          `Berhasil import ${result.successCount} siswa, ${result.failedCount} gagal`,
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
        error.response?.data?.message || "Gagal mengimport data siswa",
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
      {
        title: "Baris",
        dataIndex: "row",
        key: "row",
      },
      {
        title: "NISN",
        key: "nisn",
        render: (_: any, record: any) => record.data["NISN"],
      },
      {
        title: "Nama Lengkap",
        key: "full_name",
        render: (_: any, record: any) => record.data["Nama Lengkap"],
      },
      {
        title: "Kelas",
        key: "kelas",
        render: (_: any, record: any) => record.data["Kelas"],
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
        title: "Pesan Kesalahan",
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
                title: "NISN",
                dataIndex: ["data", "NISN"],
                key: "nisn",
              },
              {
                title: "Nama Lengkap",
                dataIndex: ["data", "Nama Lengkap"],
                key: "full_name",
              },
              {
                title: "Kelas",
                dataIndex: ["data", "Kelas"],
                key: "kelas",
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
      title: "NISN",
      dataIndex: "nisn",
      key: "nisn",
    },
    {
      title: "Nama Lengkap",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Kelas",
      dataIndex: "class_name",
      key: "class_name",
      render: (className: string) => (
        <Tag color={token.colorPrimary} style={{ color: "#003ab8" }}>
          {className}
        </Tag>
      ),
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
      render: (_: any, record: Student) => {
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
      render: (_: any, record: Student) => (
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
            title="Hapus siswa ini?"
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

  const isSmallScreen = !screens.md;

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
            Manajemen Akun Siswa
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola data akun siswa, termasuk penambahan, pengeditan, dan
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
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
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
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <Space wrap>
          <Input
            placeholder="Cari nama, NISN, atau username siswa..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Filter Kelas"
            value={filterClass}
            onChange={setFilterClass}
            allowClear
            showSearch
            optionFilterProp="children"
            options={classes.map((cls) => ({
              label: cls.class_name,
              value: cls.id,
            }))}
          />
          <Select
            placeholder="Filter Status Wajah"
            value={filterFaceStatus}
            onChange={setFilterFaceStatus}
            allowClear
            options={[
              { label: "Terdaftar", value: "registered" },
              { label: "Belum Daftar", value: "unregistered" },
            ]}
          />
          <Popconfirm
            title="Hapus semua siswa?"
            description="Yakin ingin menghapus semua data siswa?"
            onConfirm={handleDeleteAll}
            okText="Ya, hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={students.length === 0 || loading}
            ></Button>
          </Popconfirm>
        </Space>
        <Text type="secondary">
          Menampilkan {filteredStudents.length} dari {students.length} siswa
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} siswa`,
          }}
          scroll={{ x: "max-content" }}
        />
      </Spin>

      {}
      <Modal
        title={editingId ? "Edit Data Siswa" : "Tambah Siswa Baru"}
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
            label="Nama Lengkap"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input placeholder="Contoh: Ahmad Rahman" />
          </Form.Item>
          <Form.Item
            name="nisn"
            label="NISN"
            rules={[{ required: true, message: "NISN wajib diisi" }]}
          >
            <Input placeholder="Nomor Induk Siswa Nasional" />
          </Form.Item>
          <Form.Item
            name="class_id"
            label="Kelas"
            rules={[{ required: true, message: "Pilih kelas" }]}
          >
            <Select
              placeholder="Pilih kelas siswa"
              showSearch
              optionFilterProp="children"
              options={classes.map((cls) => ({
                label: cls.class_name,
                value: cls.id,
              }))}
            />
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

      {}
      <Modal
        title="Import Data Siswa"
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
        destroyOnClose
      >
        <Upload.Dragger
          {...uploadProps}
          disabled={importLoading || !!importResult}
          onChange={handleFileChange}
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

export default ManageStudents;
