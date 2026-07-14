

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Typography,
  Spin,
  Button,
  Space,
  Modal,
  message,
  Upload,
  Image,
  Tooltip,
  Flex,
  theme,
  Grid,
  Select,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message || fallback;
  }

  return fallback;
};

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
  attachment?: string;
  has_attachment?: boolean;
}

const TeachingSchedule: React.FC = () => {
  usePageTitle("Jadwal Mengajar");
  const { token } = useToken();
  const screens = useBreakpoint();

  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [filteredSchedule, setFilteredSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [uploadFile, setUploadFile] = useState<UploadFile | null>(null);

  const isSmallScreen = !screens.md;
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/teacher/schedule");
      const dataWithAttachmentFlag = res.data.map((item: Schedule) => ({
        ...item,
        has_attachment: !!item.attachment,
      }));
      setSchedule(dataWithAttachmentFlag);
      setFilteredSchedule(dataWithAttachmentFlag);
    } catch (error) {
      message.error("Gagal memuat data jadwal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  
  useEffect(() => {
    if (selectedDay === "all") {
      setFilteredSchedule(schedule);
    } else {
      setFilteredSchedule(schedule.filter((item) => item.day === selectedDay));
    }
  }, [selectedDay, schedule]);

  
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  
  const handleUploadClick = (record: Schedule) => {
    setSelectedSchedule(record);
    setUploadFile(null);
    setUploadModalVisible(true);
  };

  
  const handleUploadFile = async (file: File) => {
    if (!selectedSchedule) {
      message.error("Data jadwal tidak ditemukan");
      return false;
    }

    
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Hanya file gambar yang diperbolehkan!");
      return false;
    }

    
    const isLt5MB = file.size / 1024 / 1024 < 5;
    if (!isLt5MB) {
      message.error("Ukuran gambar maksimal 5MB!");
      return false;
    }

    setUploadLoading(true);
    try {
      const base64String = await convertFileToBase64(file);
      await api.post(`/teacher/schedule/${selectedSchedule.id}/attachment`, {
        attachment: base64String,
      });
      message.success("Lampiran berhasil diupload");
      setUploadModalVisible(false);
      setUploadFile(null);
      setSelectedSchedule(null);
      fetchSchedule();
    } catch (error) {
      message.error(getErrorMessage(error, "Gagal mengupload lampiran"));
    } finally {
      setUploadLoading(false);
    }

    return false; 
  };

  
  const handleDeleteAttachment = async (scheduleId: number) => {
    Modal.confirm({
      title: "Hapus Lampiran",
      content: "Apakah Anda yakin ingin menghapus lampiran ini?",
      okText: "Ya, Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/teacher/schedule/${scheduleId}/attachment`);
          message.success("Lampiran berhasil dihapus");
          fetchSchedule();
        } catch (error) {
          message.error("Gagal menghapus lampiran");
        }
      },
    });
  };

  
  const handlePreviewAttachment = (attachment: string) => {
    setPreviewImage(attachment);
    setPreviewVisible(true);
  };

  
  const columns = [
    {
      title: "No",
      key: "no",
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
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
      title: "Ruangan",
      dataIndex: "room",
      key: "room",
    },
    {
      title: "Lampiran",
      key: "lampiran",
      render: (_: unknown, record: Schedule) =>
        record.has_attachment ? (
          <Tooltip title="Sudah diupload">
            <Tag color="success">Terlampir</Tag>
          </Tooltip>
        ) : (
          <Tooltip title="Belum diupload">
            <Tag color="warning">Belum</Tag>
          </Tooltip>
        ),
    },
    {
      title: "Aksi",
      key: "action",
      fixed: isSmallScreen ? undefined : ("right" as const),
      render: (_: unknown, record: Schedule) => (
        <Space size="small">
          {record.attachment ? (
            <>
              <Tooltip title="Lihat Lampiran">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreviewAttachment(record.attachment!)}
                  style={{ color: token.colorPrimary }}
                />
              </Tooltip>
              <Tooltip title="Ganti Lampiran">
                <Button
                  type="text"
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => handleUploadClick(record)}
                  style={{ color: token.colorWarning }}
                />
              </Tooltip>
              <Tooltip title="Hapus Lampiran">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteAttachment(record.id)}
                />
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Upload Lampiran ">
              <Button
                type="text"
                onClick={() => handleUploadClick(record)}
                style={{ color: token.colorPrimary }}
              >
                Upload
              </Button>
            </Tooltip>
          )}
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
            Jadwal Mengajar
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola jadwal mengajar Anda dan unggah bukti kehadiran
          </Text>
        </div>
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
          <Select
            value={selectedDay}
            onChange={setSelectedDay}
            options={[
              { label: "Semua Hari", value: "all" },
              ...days.map((day) => ({ label: day, value: day })),
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSchedule}
            loading={loading}
            style={{
              backgroundColor: token.colorPrimary,
              color: token.colorTextLightSolid,
            }}
          >
            Refresh
          </Button>
        </Space>
        <Text type="secondary">
          Menampilkan {filteredSchedule.length} dari {schedule.length} jadwal
        </Text>
      </Flex>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredSchedule}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total} jadwal`,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: isSmallScreen ? 800 : undefined }}
        />
      </Spin>

      {}
      <Modal
        title={
          <Space>
            <Text strong>Upload Lampiran Bukti Mengajar</Text>
          </Space>
        }
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setSelectedSchedule(null);
          setUploadFile(null);
        }}
        footer={null}
        width={500}
        destroyOnClose
      >
        {selectedSchedule && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Upload foto sebagai bukti mengajar di dalam kelas.
              <br /> Format yang didukung: JPG, PNG, JPEG (Maks. 5MB)
            </Text>

            <Upload
              accept="image/*"
              beforeUpload={handleUploadFile}
              maxCount={1}
              listType="picture-card"
              disabled={uploadLoading}
              fileList={uploadFile ? [uploadFile] : []}
              onChange={({ file }) => {
                if (file.status === "removed") {
                  setUploadFile(null);
                } else {
                  setUploadFile(file);
                }
              }}
              onRemove={() => setUploadFile(null)}
            >
              {!uploadFile && (
                <div>
                  <UploadOutlined style={{ fontSize: 24 }} />
                  <div style={{ marginTop: 8 }}>Upload Foto</div>
                </div>
              )}
            </Upload>

            {uploadLoading && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Spin />
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8 }}
                >
                  Mengupload gambar...
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {}
      <Modal
        open={previewVisible}
        title={
          <Space>
            <EyeOutlined />
            <Text strong>Preview Lampiran</Text>
          </Space>
        }
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
      >
        <Image
          alt="Lampiran Bukti Mengajar"
          style={{ width: "100%", borderRadius: token.borderRadiusLG }}
          src={previewImage}
          preview={false}
        />
      </Modal>
    </div>
  );
};

export default TeachingSchedule;
