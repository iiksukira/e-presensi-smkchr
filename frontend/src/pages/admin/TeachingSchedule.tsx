/** @format */

import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  Button,
  Space,
  Popconfirm,
  message,
  theme,
  Flex,
  Grid,
  Image,
  Tooltip,
  Spin,
  Upload,
  Progress,
  Alert,
} from "antd";
import type { UploadProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  ImportOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Schedule {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  time_range: string;
  subject_name: string;
  class_id: number;
  class_name: string;
  room: string;
  teacher_name?: string;
  teacher_id?: number;
  attachment?: string;
}

interface Class {
  id: number;
  class_name: string;
}

interface Teacher {
  id: number;
  full_name: string;
}

const AdminTeachingSchedule: React.FC = () => {
  usePageTitle("Jadwal Mengajar");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [filteredSchedule, setFilteredSchedule] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<number | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const isSmallScreen = !screens.md;

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/schedule");
      setSchedule(res.data);
      setFilteredSchedule(res.data);
    } catch (error) {
      message.error("Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get("/admin/classes");
      setClasses(res.data);
    } catch (error) {}
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get("/admin/teachers");
      setTeachers(res.data);
    } catch (error) {}
  }, []);

  useEffect(() => {
    fetchSchedule();
    fetchClasses();
    fetchTeachers();
  }, [fetchSchedule, fetchClasses, fetchTeachers]);

  useEffect(() => {
    let filtered = [...schedule];

    if (searchText) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    }

    if (filterDay) {
      filtered = filtered.filter((item) => item.day === filterDay);
    }

    if (filterClass) {
      filtered = filtered.filter((item) => item.class_id === filterClass);
    }

    setFilteredSchedule(filtered);
  }, [searchText, filterDay, filterClass, schedule]);

  const handleAddSchedule = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleImportSchedule = () => {
    setIsImportModalVisible(true);
    setImportResult(null);
    setPreviewData([]);
    setFileList([]);
    setImportProgress(0);
  };

  const handleEditSchedule = (record: Schedule) => {
    setEditingId(record.id);
    form.setFieldsValue({
      day: record.day,
      start_time: dayjs(record.start_time, "HH:mm:ss"),
      end_time: dayjs(record.end_time, "HH:mm:ss"),
      subject: record.subject_name,
      class_id: record.class_id,
      room: record.room,
      teacher_id: record.teacher_id,
    });
    setModalVisible(true);
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await api.delete(`/admin/schedule/${id}`);
      message.success("Jadwal berhasil dihapus");
      fetchSchedule();
    } catch (error) {
      message.error("Gagal menghapus jadwal");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        day: values.day,
        start_time: values.start_time.format("HH:mm:ss"),
        end_time: values.end_time.format("HH:mm:ss"),
        subject: values.subject,
        class_id: values.class_id,
        room: values.room || null,
        teacher_id: values.teacher_id,
      };

      if (editingId) {
        await api.put(`/admin/schedule/${editingId}`, data);
        message.success("Jadwal berhasil diupdate");
      } else {
        await api.post("/admin/schedule", data);
        message.success("Jadwal berhasil ditambahkan");
      }

      setModalVisible(false);
      form.resetFields();
      fetchSchedule();
    } catch (error) {
      message.error("Gagal menyimpan jadwal");
    }
  };

  const handlePreviewAttachment = (attachment: string) => {
    setPreviewImage(attachment);
    setPreviewVisible(true);
  };

  const handleResetAttachment = async (record: Schedule) => {
    try {
      const data = {
        day: record.day,
        start_time: record.start_time,
        end_time: record.end_time,
        subject: record.subject_name,
        class_id: record.class_id,
        room: record.room || null,
        teacher_id: record.teacher_id,
        attachment: null,
      };
      await api.put(`/admin/schedule/${record.id}`, data);
      message.success("Lampiran berhasil dihapus");
      fetchSchedule();
    } catch (error) {
      message.error("Gagal menghapus lampiran");
    }
  };

  const handleResetAllAttachments = async () => {
    Modal.confirm({
      title: "Reset Semua Lampiran",
      content:
        "Apakah Anda yakin ingin menghapus semua lampiran? Tindakan ini tidak dapat dibatalkan.",
      okText: "Ya",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setLoading(true);
          await Promise.all(
            schedule
              .filter((s) => s.attachment)
              .map((s) => {
                const data = {
                  day: s.day,
                  start_time: s.start_time,
                  end_time: s.end_time,
                  subject: s.subject_name,
                  class_id: s.class_id,
                  room: s.room || null,
                  teacher_id: s.teacher_id,
                  attachment: null,
                };
                return api.put(`/admin/schedule/${s.id}`, data);
              }),
          );
          message.success("Semua lampiran berhasil dihapus");
          fetchSchedule();
        } catch (error) {
          message.error("Gagal menghapus lampiran");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        Hari: "Senin",
        "Jam Mulai": "07:00",
        "Jam Selesai": "08:00",
        "Mata Pelajaran": "Dasar-dasar Teknik Mesin",
        Kelas: "XII TSM",
        Guru: "Budi Santoso",
        Ruangan: "Ruang 1",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Jadwal");

    ws["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 24 },
      { wch: 20 },
      { wch: 24 },
      { wch: 14 },
    ];

    XLSX.writeFile(wb, "template_import_jadwal.xlsx");
  };

  const handleFileChange = (info: any) => {
    setFileList(info.fileList.slice(-1));

    const file = info.file.originFileObj;
    if (!file) return;

    setPreviewData([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.warning("File tidak mengandung data");
          return;
        }

        const validatedData = jsonData.map((row: any, index: number) => {
          const errors: string[] = [];

          const dayValue = String(row["Hari"] ?? row["Day"] ?? "").trim();
          const startValue = String(
            row["Jam Mulai"] ?? row["Start Time"] ?? "",
          ).trim();
          const endValue = String(
            row["Jam Selesai"] ?? row["End Time"] ?? "",
          ).trim();
          const subjectValue = String(
            row["Mata Pelajaran"] ?? row["Subject"] ?? "",
          ).trim();
          const classValue = String(row["Kelas"] ?? row["Class"] ?? "").trim();
          const teacherValue = String(
            row["Guru"] ?? row["Teacher"] ?? row["Nama Guru"] ?? "",
          ).trim();
          const roomValue = String(row["Ruangan"] ?? row["Room"] ?? "").trim();

          if (!dayValue) errors.push("Hari wajib diisi");
          if (!startValue) errors.push("Jam mulai wajib diisi");
          if (!endValue) errors.push("Jam selesai wajib diisi");
          if (!subjectValue) errors.push("Mata pelajaran wajib diisi");
          if (!classValue) errors.push("Kelas wajib diisi");
          if (!teacherValue) errors.push("Guru wajib diisi");

          const normalizedDay = days.find(
            (item) => item.toLowerCase() === dayValue.toLowerCase(),
          );
          if (dayValue && !normalizedDay) {
            errors.push(`Hari "${dayValue}" tidak valid`);
          }

          const parsedStart = dayjs(
            startValue,
            ["HH:mm", "HH:mm:ss", "H:mm"],
            true,
          );
          const parsedEnd = dayjs(
            endValue,
            ["HH:mm", "HH:mm:ss", "H:mm"],
            true,
          );
          if (startValue && !parsedStart.isValid()) {
            errors.push("Format jam mulai tidak valid. Gunakan HH:mm");
          }
          if (endValue && !parsedEnd.isValid()) {
            errors.push("Format jam selesai tidak valid. Gunakan HH:mm");
          }

          const classMatch = classes.find(
            (item) =>
              item.class_name.toLowerCase() === classValue.toLowerCase(),
          );
          if (classValue && !classMatch) {
            errors.push(`Kelas "${classValue}" tidak ditemukan`);
          }

          const teacherMatch = teachers.find(
            (item) =>
              item.full_name.toLowerCase() === teacherValue.toLowerCase(),
          );
          if (teacherValue && !teacherMatch) {
            errors.push(`Guru "${teacherValue}" tidak ditemukan`);
          }

          return {
            row: index + 1,
            data: row,
            errors,
            isValid: errors.length === 0,
            classId: classMatch?.id || null,
            teacherId: teacherMatch?.id || null,
            normalizedDay,
            startTime: parsedStart.isValid()
              ? parsedStart.format("HH:mm:ss")
              : null,
            endTime: parsedEnd.isValid() ? parsedEnd.format("HH:mm:ss") : null,
            subject: subjectValue,
            className: classValue,
            teacherName: teacherValue,
            room: roomValue,
          };
        });

        setPreviewData(validatedData);

        const validCount = validatedData.filter((item) => item.isValid).length;
        const invalidCount = validatedData.filter(
          (item) => !item.isValid,
        ).length;

        if (validCount === 0 && invalidCount > 0) {
          message.warning(
            "Tidak ada data yang valid untuk diimport. Periksa format data.",
          );
        } else {
          message.success(
            `${validCount} data valid, ${invalidCount} data bermasalah`,
          );
        }
      } catch (error) {
        message.error("Gagal membaca file. Pastikan format file benar.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const uploadProps: UploadProps = {
    name: "file",
    accept: ".xlsx,.xls,.csv",
    fileList,
    beforeUpload: (file) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("File harus lebih kecil dari 5MB!");
        return false;
      }

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
            message.warning("File tidak mengandung data");
            return;
          }

          const validatedData = jsonData.map((row: any, index: number) => {
            const errors: string[] = [];
            const dayValue = String(row["Hari"] ?? row["Day"] ?? "").trim();
            const startValue = String(
              row["Jam Mulai"] ?? row["Start Time"] ?? "",
            ).trim();
            const endValue = String(
              row["Jam Selesai"] ?? row["End Time"] ?? "",
            ).trim();
            const subjectValue = String(
              row["Mata Pelajaran"] ?? row["Subject"] ?? "",
            ).trim();
            const classValue = String(
              row["Kelas"] ?? row["Class"] ?? "",
            ).trim();
            const teacherValue = String(
              row["Guru"] ?? row["Teacher"] ?? row["Nama Guru"] ?? "",
            ).trim();
            const roomValue = String(
              row["Ruangan"] ?? row["Room"] ?? "",
            ).trim();

            if (!dayValue) errors.push("Hari wajib diisi");
            if (!startValue) errors.push("Jam mulai wajib diisi");
            if (!endValue) errors.push("Jam selesai wajib diisi");
            if (!subjectValue) errors.push("Mata pelajaran wajib diisi");
            if (!classValue) errors.push("Kelas wajib diisi");
            if (!teacherValue) errors.push("Guru wajib diisi");

            const normalizedDay = days.find(
              (item) => item.toLowerCase() === dayValue.toLowerCase(),
            );
            if (dayValue && !normalizedDay) {
              errors.push(`Hari "${dayValue}" tidak valid`);
            }

            const parsedStart = dayjs(
              startValue,
              ["HH:mm", "HH:mm:ss", "H:mm"],
              true,
            );
            const parsedEnd = dayjs(
              endValue,
              ["HH:mm", "HH:mm:ss", "H:mm"],
              true,
            );
            if (startValue && !parsedStart.isValid()) {
              errors.push("Format jam mulai tidak valid. Gunakan HH:mm");
            }
            if (endValue && !parsedEnd.isValid()) {
              errors.push("Format jam selesai tidak valid. Gunakan HH:mm");
            }

            const classMatch = classes.find(
              (item) =>
                item.class_name.toLowerCase() === classValue.toLowerCase(),
            );
            if (classValue && !classMatch) {
              errors.push(`Kelas "${classValue}" tidak ditemukan`);
            }

            const teacherMatch = teachers.find(
              (item) =>
                item.full_name.toLowerCase() === teacherValue.toLowerCase(),
            );
            if (teacherValue && !teacherMatch) {
              errors.push(`Guru "${teacherValue}" tidak ditemukan`);
            }

            return {
              row: index + 1,
              data: row,
              errors,
              isValid: errors.length === 0,
              classId: classMatch?.id || null,
              teacherId: teacherMatch?.id || null,
              normalizedDay,
              startTime: parsedStart.isValid()
                ? parsedStart.format("HH:mm:ss")
                : null,
              endTime: parsedEnd.isValid()
                ? parsedEnd.format("HH:mm:ss")
                : null,
              subject: subjectValue,
              className: classValue,
              teacherName: teacherValue,
              room: roomValue,
            };
          });

          setPreviewData(validatedData);

          const validCount = validatedData.filter(
            (item) => item.isValid,
          ).length;
          const invalidCount = validatedData.filter(
            (item) => !item.isValid,
          ).length;

          if (validCount === 0 && invalidCount > 0) {
            message.warning(
              "Tidak ada data yang valid untuk diimport. Periksa format data.",
            );
          } else {
            message.success(
              `${validCount} data valid, ${invalidCount} data bermasalah`,
            );
          }
        } catch (error) {
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
      const importData = validData.map((item) => ({
        day: item.normalizedDay,
        start_time: item.startTime,
        end_time: item.endTime,
        subject: item.subject,
        class_id: item.classId,
        room: item.room || null,
        teacher_id: item.teacherId,
      }));

      const response = await api.post("/admin/schedules/import", {
        schedules: importData,
      });

      const result = response.data;
      setImportResult(result);

      if (result.failedCount === 0) {
        message.success(`Berhasil mengimport ${result.successCount} jadwal`);
      } else {
        message.warning(
          `Berhasil import ${result.successCount} jadwal, ${result.failedCount} gagal`,
        );
      }

      await fetchSchedule();

      setTimeout(() => {
        setIsImportModalVisible(false);
        setImportResult(null);
        setPreviewData([]);
        setFileList([]);
        setImportProgress(0);
      }, 3000);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengimport data jadwal",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const renderImportPreview = () => {
    if (previewData.length === 0) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <Text strong>Preview Data yang Akan Diimport</Text>
        <Table
          size="small"
          dataSource={previewData}
          pagination={false}
          scroll={{ y: 240 }}
          columns={[
            { title: "Baris", dataIndex: "row" },
            {
              title: "Status",
              render: (_: any, record: any) =>
                record.isValid ? (
                  <Tag color="success">Valid</Tag>
                ) : (
                  <Tag color="error">Perlu Perbaikan</Tag>
                ),
            },
            {
              title: "Detail",
              render: (_: any, record: any) => (
                <div>
                  <div>
                    <strong>{record.subject || "-"}</strong> ·{" "}
                    {record.className || "-"} · {record.teacherName || "-"}
                  </div>
                  {record.errors.length > 0 && (
                    <div style={{ color: token.colorError, fontSize: 12 }}>
                      {record.errors.join("; ")}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    );
  };

  const renderImportResult = () => {
    if (!importResult) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <Alert
          type={importResult.failedCount === 0 ? "success" : "warning"}
          showIcon
          title={importResult.message || "Hasil impor"}
          description={
            <div>
              <div>Berhasil: {importResult.successCount}</div>
              <div>Gagal: {importResult.failedCount}</div>
            </div>
          }
        />
      </div>
    );
  };

  const columns = [
    {
      title: "Hari",
      dataIndex: "day",
      key: "day",
    },
    {
      title: "Jam",
      dataIndex: "time_range",
      key: "time_range",
    },
    {
      title: "Mata Pelajaran",
      dataIndex: "subject_name",
      key: "subject_name",
    },
    {
      title: "Kelas",
      dataIndex: "class_name",
      key: "class_name",
    },
    {
      title: "Guru",
      dataIndex: "teacher_name",
      key: "teacher_name",
    },
    {
      title: "Ruangan",
      dataIndex: "room",
      key: "room",
    },
    {
      title: "Lampiran",
      dataIndex: "attachment",
      key: "attachment",
      render: (attachment: string | undefined, record: Schedule) => {
        if (attachment) {
          return (
            <Space size="small">
              <Tooltip title="Lihat Lampiran">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreviewAttachment(attachment)}
                  style={{ color: token.colorPrimary }}
                >
                  Lihat
                </Button>
              </Tooltip>
              <Tooltip title="Hapus Lampiran">
                <Popconfirm
                  title="Hapus Lampiran"
                  description="Apakah Anda yakin ingin menghapus lampiran ini?"
                  onConfirm={() => handleResetAttachment(record)}
                  okText="Ya"
                  cancelText="Batal"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Tooltip>
            </Space>
          );
        }
        return (
          <Tag color="default" style={{ color: "#999" }}>
            Belum Ada
          </Tag>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      render: (_: any, record: Schedule) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditSchedule(record)}
            style={{ color: token.colorPrimary }}
          />
          <Popconfirm
            title="Hapus Jadwal"
            description="Apakah Anda yakin ingin menghapus jadwal ini?"
            onConfirm={() => handleDeleteSchedule(record.id)}
            okText="Ya"
            cancelText="Batal"
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
            Manajemen Jadwal Mengajar
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola jadwal mengajar, termasuk penambahan, pengeditan, dan
            penghapusan jadwal
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchSchedule}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSchedule}
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
            onClick={handleImportSchedule}
            style={{
              backgroundColor: token.colorPrimary,
              borderColor: token.colorPrimary,
            }}
          >
            Import
          </Button>

          <Button
            danger
            onClick={handleResetAllAttachments}
            size="medium"
            loading={loading}
          >
            Reset Lampiran
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
            placeholder="Cari mata pelajaran, guru, atau kelas..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Filter Hari"
            value={filterDay}
            onChange={setFilterDay}
            allowClear
            style={{ width: "100%" }}
            options={days.map((day) => ({
              label: day,
              value: day,
            }))}
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
        </Space>

        <Text type="secondary">
          Menampilkan {filteredSchedule.length} dari {schedule.length} jadwal
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          dataSource={filteredSchedule}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} jadwal`,
          }}
          scroll={{ x: "max-content" }}
        />
      </Spin>

      {}
      <Modal
        title={editingId ? "Edit Jadwal Mengajar" : "Tambah Jadwal Mengajar"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
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
        <Form form={form} layout="vertical">
          <Form.Item
            label="Hari"
            name="day"
            rules={[{ required: true, message: "Pilih hari!" }]}
          >
            <Select
              placeholder="Pilih hari"
              options={days.map((day) => ({
                label: day,
                value: day,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Jam Mulai"
            name="start_time"
            rules={[{ required: true, message: "Pilih jam mulai!" }]}
          >
            <TimePicker
              format="HH:mm"
              placeholder="HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Jam Selesai"
            name="end_time"
            rules={[{ required: true, message: "Pilih jam selesai!" }]}
          >
            <TimePicker
              format="HH:mm"
              placeholder="HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Mata Pelajaran"
            name="subject"
            rules={[{ required: true, message: "Masukkan mata pelajaran!" }]}
          >
            <Input placeholder="Contoh: Matematika" />
          </Form.Item>

          <Form.Item
            label="Kelas"
            name="class_id"
            rules={[{ required: true, message: "Pilih kelas!" }]}
          >
            <Select
              placeholder="Pilih kelas"
              showSearch
              optionFilterProp="children"
              options={classes.map((cls) => ({
                label: cls.class_name,
                value: cls.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Guru"
            name="teacher_id"
            rules={[{ required: true, message: "Pilih guru!" }]}
          >
            <Select
              placeholder="Pilih guru"
              showSearch
              optionFilterProp="children"
              options={teachers.map((teacher) => ({
                label: teacher.full_name,
                value: teacher.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="Ruangan" name="room">
            <Input placeholder="Contoh: Ruang 101" />
          </Form.Item>
        </Form>
      </Modal>

      {}
      <Modal
        title="Import Data Jadwal"
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
            key="cancel"
            onClick={() => {
              setIsImportModalVisible(false);
              setImportResult(null);
              setPreviewData([]);
              setFileList([]);
              setImportProgress(0);
            }}
          >
            Tutup
          </Button>,
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
        width={900}
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

      {}
      <Modal
        open={previewVisible}
        title="Preview Lampiran Bukti Mengajar"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <Image
          alt="lampiran"
          style={{ width: "100%" }}
          src={previewImage}
          preview={false}
        />
      </Modal>
    </div>
  );
};

export default AdminTeachingSchedule;
