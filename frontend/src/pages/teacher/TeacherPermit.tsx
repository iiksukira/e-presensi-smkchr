/** @format */

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Upload,
  Table,
  Typography,
  Flex,
  theme,
  Grid,
  Modal,
  message,
  Descriptions,
  Empty,
  Popconfirm,
  Spin,
  Tag,
  Tabs,
  Row,
  Col,
  Space,
  Tooltip,
  Image,
} from "antd";
import {
  FileTextOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  CarOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileImageOutlined,
  ReloadOutlined,
  CameraOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileOutlined,
  EditOutlined,
  SearchOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import api from "../../api/instance";
import Paragraph from "antd/es/typography/Paragraph";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface FilterParams {
  status?: string;
  type?: string;
  dateRange?: [string, string];
  search?: string;
}

interface TeacherPermit {
  id: number;
  type: "sick" | "leave" | "business" | "remote";
  typeLabel: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: string;
  attachmentUrls?: string[];
  status: "pending" | "approved" | "rejected";
  statusLabel: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const TeacherPermit: React.FC = () => {
  usePageTitle("Pengajuan Izin Guru");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [permits, setPermits] = useState<TeacherPermit[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<TeacherPermit | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [editFileList, setEditFileList] = useState<UploadFile[]>([]);
  const [selectedPermitType, setSelectedPermitType] = useState<string>("");
  const [editPermitType, setEditPermitType] = useState<string>("");
  const [previewFiles, setPreviewFiles] = useState<Array<{
    url: string;
    type: string;
    name: string;
    extension: string;
  }> | null>(null);

  const fileBaseUrl = (import.meta.env.VITE_API_URL || "").replace(
    /\/api\/?$/,
    "",
  );

  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);

  const [filters, setFilters] = useState<FilterParams>({});
  const [searchText, setSearchText] = useState("");

  const isSmallScreen = !screens.md;

  const getAttachmentRequirement = (type: string) => {
    switch (type) {
      case "sick":
        return {
          required: true,
          message: "Wajib upload surat dokter (max 2MB, format JPG/PNG/PDF)",
          maxFiles: 1,
          label: "Surat Dokter",
        };
      case "leave":
        return {
          required: true,
          message: "Wajib upload surat cuti (max 2MB, format JPG/PNG/PDF)",
          maxFiles: 1,
          label: "Surat Cuti",
        };
      case "business":
        return {
          required: true,
          message: "Wajib upload minimal 2 foto/surat tugas (max 2MB per file)",
          maxFiles: 4,
          label: "Dokumen Tugas/Dinas",
        };
      case "remote":
        return {
          required: true,
          message: "Wajib upload minimal 2 foto dokumentasi (max 2MB per file)",
          maxFiles: 4,
          label: "Dokumentasi WFH",
        };
      default:
        return {
          required: true,
          message: "Wajib upload lampiran (max 2MB, format JPG/PNG/PDF)",
          maxFiles: 1,
          label: "Lampiran",
        };
    }
  };

  const attachmentReq = getAttachmentRequirement(selectedPermitType);
  const editAttachmentReq = getAttachmentRequirement(editPermitType);

  const filteredPermits = useMemo(() => {
    let result = [...permits];

    if (activeTab !== "all") {
      result = result.filter((permit) => permit.status === activeTab);
    }

    if (filters.type) {
      result = result.filter((permit) => permit.type === filters.type);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      result = result.filter((permit) => {
        const permitDate = dayjs(permit.createdAt);
        return (
          permitDate.isAfter(dayjs(start)) &&
          permitDate.isBefore(dayjs(end).add(1, "day"))
        );
      });
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter((permit) =>
        permit.reason.toLowerCase().includes(search),
      );
    }

    return result;
  }, [permits, activeTab, filters, searchText]);

  const handleResetFilters = () => {
    setFilters({});
    setSearchText("");
    setActiveTab("all");
  };

  const fetchTeacherData = async () => {
    try {
      const response = await api.get("/teacher/profile");
      response.data;
    } catch (error: any) {}
  };

  const fetchPermits = async () => {
    setLoading(true);
    try {
      const response = await api.get("/teacher/permits");

      const processedPermits = response.data.map((permit: any) => ({
        ...permit,
        attachmentUrls: permit.attachment ? permit.attachment.split(",") : [],
      }));
      setPermits(processedPermits);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengambil data izin",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
    fetchPermits();
  }, []);

  const handlePermitTypeChange = (value: string) => {
    setSelectedPermitType(value);
    setFileList([]);
    form.setFieldValue("type", value);
  };

  const handleEditPermitTypeChange = (value: string) => {
    setEditPermitType(value);
    setEditFileList([]);
    editForm.setFieldValue("type", value);
  };

  const handleUpload = async (fileList: UploadFile[]) => {
    if (fileList.length === 0) return [];

    const formData = new FormData();
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("files", file.originFileObj);
      }
    });

    try {
      const response = await api.post("/upload/permits", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        return response.data.urls;
      }
      return [];
    } catch (error: any) {
      message.error(error.response?.data?.message || "Gagal upload file");
      return [];
    }
  };

  const handleSubmit = async (values: any) => {
    const requirement = getAttachmentRequirement(values.type);

    if (requirement.required) {
      if (fileList.length === 0) {
        message.error(requirement.message);
        return;
      }

      if (values.type === "business" || values.type === "remote") {
        if (fileList.length < 2) {
          message.error(`${requirement.message}. Minimal 2 file.`);
          return;
        }
      }
    }

    setSubmitting(true);
    let attachmentUrl = "";

    try {
      if (fileList.length > 0) {
        const uploadedUrls = await handleUpload(fileList);

        if (uploadedUrls.length > 0) {
          attachmentUrl = uploadedUrls.join(",");
        } else if (requirement.required) {
          message.error("Gagal upload file. Silakan coba lagi.");
          setSubmitting(false);
          return;
        }
      } else if (requirement.required) {
        message.error(requirement.message);
        setSubmitting(false);
        return;
      }

      const permitData = {
        permit_type: values.type,
        start_date: values.dateRange[0].format("YYYY-MM-DD"),
        end_date: values.dateRange[1].format("YYYY-MM-DD"),
        reason: values.reason,
        attachment_url: attachmentUrl || null,
      };

      await api.post("/teacher/permits", permitData);

      message.success("Pengajuan izin berhasil dikirim");
      form.resetFields();
      setFileList([]);
      setSelectedPermitType("");
      setIsModalVisible(false);
      fetchPermits();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengirim pengajuan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (record: TeacherPermit) => {
    if (record.status !== "pending") {
      message.warning(
        "Hanya pengajuan dengan status 'Menunggu' yang dapat diedit",
      );
      return;
    }

    setSelectedPermit(record);
    setEditPermitType(record.type);

    editForm.setFieldsValue({
      type: record.type,
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
      reason: record.reason,
    });

    if (record.attachmentUrls && record.attachmentUrls.length > 0) {
      const existingFiles = record.attachmentUrls.map((url, index) => ({
        uid: `existing-${index}`,
        name: `Lampiran_${index + 1}`,
        status: "done" as const,
        url: url,
      }));
      setEditFileList(existingFiles);
    } else {
      setEditFileList([]);
    }

    setIsEditModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    if (!selectedPermit) return;

    const requirement = getAttachmentRequirement(values.type);
    const hasExistingFiles = editFileList.some(
      (file) => file.url && !file.originFileObj,
    );

    if (requirement.required && !hasExistingFiles) {
      if (editFileList.length === 0) {
        message.error(requirement.message);
        return;
      }

      if (
        (values.type === "business" || values.type === "remote") &&
        editFileList.length < 2
      ) {
        message.error(`${requirement.message}. Minimal 2 file.`);
        return;
      }
    }

    setEditSubmitting(true);
    let attachmentUrl = "";

    try {
      const newFiles = editFileList.filter((file) => file.originFileObj);

      if (newFiles.length > 0) {
        const uploadedUrls = await handleUpload(newFiles);

        if (uploadedUrls.length > 0) {
          attachmentUrl = uploadedUrls.join(",");
        } else if (requirement.required) {
          message.error("Gagal upload file. Silakan coba lagi.");
          setEditSubmitting(false);
          return;
        }
      } else if (hasExistingFiles) {
        const existingUrls = editFileList
          .filter((file) => file.url)
          .map((file) => file.url)
          .join(",");
        attachmentUrl = existingUrls;
      } else if (requirement.required) {
        message.error(requirement.message);
        setEditSubmitting(false);
        return;
      }

      const permitData = {
        permit_type: values.type,
        start_date: values.dateRange[0].format("YYYY-MM-DD"),
        end_date: values.dateRange[1].format("YYYY-MM-DD"),
        reason: values.reason,
        attachment_url: attachmentUrl || null,
      };

      await api.put(`/teacher/permits/${selectedPermit.id}`, permitData);

      message.success("Pengajuan izin berhasil diperbarui");
      editForm.resetFields();
      setEditFileList([]);
      setSelectedPermit(null);
      setEditPermitType("");
      setIsEditModalVisible(false);
      fetchPermits();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal memperbarui pengajuan",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCancelPermit = async (id: number) => {
    try {
      await api.delete(`/teacher/permits/${id}`);
      message.success("Pengajuan izin dibatalkan");
      fetchPermits();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal membatalkan pengajuan",
      );
    }
  };

  const handlePreviewAttachment = (permit: TeacherPermit) => {
    const attachmentUrl = permit.attachment;

    if (!attachmentUrl || attachmentUrl === "null" || attachmentUrl === "") {
      message.warning("Tidak ada lampiran untuk izin ini");
      return;
    }

    const urls = attachmentUrl.split(",").map((url) => url.trim());

    const files = urls.map((url) => {
      let fullUrl = url;
      if (!url.startsWith("http") && !url.startsWith("data:")) {
        fullUrl = `${fileBaseUrl}${url}`;
      }

      const fileExtension = url.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
        fileExtension,
      );
      const isPdf = fileExtension === "pdf";

      return {
        url: fullUrl,
        type: isImage ? "image" : isPdf ? "pdf" : "other",
        name: `Lampiran_${permit.typeLabel}`,
        extension: fileExtension,
      };
    });

    setPreviewFiles(files);
    setIsAttachmentModalVisible(true);
  };

  const handleDownloadAttachment = async (permit: TeacherPermit) => {
    const attachmentUrl = permit.attachment;

    if (!attachmentUrl || attachmentUrl === "null" || attachmentUrl === "") {
      message.warning("Tidak ada lampiran untuk izin ini");
      return;
    }

    const urls = attachmentUrl.split(",").map((url) => url.trim());

    urls.forEach((url) => {
      let fullUrl = url;
      if (!url.startsWith("http") && !url.startsWith("data:")) {
        fullUrl = `${fileBaseUrl}${url}`;
      }

      window.open(fullUrl, "_blank");
    });
  };

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg" ||
        file.type === "application/pdf";

      if (!isValidType) {
        message.error("Hanya file JPG/PNG/PDF yang diizinkan!");
        return false;
      }

      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("File harus kurang dari 2MB!");
        return false;
      }

      if (attachmentReq.maxFiles && fileList.length >= attachmentReq.maxFiles) {
        message.error(`Maksimal upload ${attachmentReq.maxFiles} file`);
        return false;
      }

      const uploadFile: UploadFile = {
        uid: `${Date.now()}-${Math.random()}`,
        name: file.name,
        originFileObj: file,
        size: file.size,
        type: file.type,
        status: "done",
      };

      setFileList([...fileList, uploadFile]);
      return false;
    },
    fileList,
    listType: "picture-card",
    maxCount: attachmentReq.maxFiles,
  };

  const editUploadProps: UploadProps = {
    onRemove: (file) => {
      const index = editFileList.indexOf(file);
      const newFileList = editFileList.slice();
      newFileList.splice(index, 1);
      setEditFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg" ||
        file.type === "application/pdf";

      if (!isValidType) {
        message.error("Hanya file JPG/PNG/PDF yang diizinkan!");
        return false;
      }

      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("File harus kurang dari 2MB!");
        return false;
      }

      if (
        editAttachmentReq.maxFiles &&
        editFileList.length >= editAttachmentReq.maxFiles
      ) {
        message.error(`Maksimal upload ${editAttachmentReq.maxFiles} file`);
        return false;
      }

      const uploadFile: UploadFile = {
        uid: `${Date.now()}-${Math.random()}`,
        name: file.name,
        originFileObj: file,
        size: file.size,
        type: file.type,
        status: "done",
      };

      setEditFileList([...editFileList, uploadFile]);
      return false;
    },
    fileList: editFileList,
    listType: "picture-card",
    maxCount: editAttachmentReq.maxFiles,
  };

  const getPermitIcon = (type: string) => {
    switch (type) {
      case "sick":
        return (
          <MedicineBoxOutlined
            style={{ color: token.colorError, fontSize: 18 }}
          />
        );
      case "leave":
        return (
          <HomeOutlined style={{ color: token.colorWarning, fontSize: 18 }} />
        );
      case "business":
        return (
          <CarOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
        );
      case "remote":
        return (
          <ClockCircleOutlined
            style={{ color: token.colorSuccess, fontSize: 18 }}
          />
        );
      default:
        return <FileTextOutlined style={{ fontSize: 18 }} />;
    }
  };

  const getFileIcon = (url?: string | null) => {
    if (!url || url === "null" || url === "") return <FileOutlined />;

    const firstUrl = url.split(",")[0].trim();
    const extension = firstUrl.split(".").pop()?.toLowerCase();
    if (extension === "pdf")
      return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <FileImageOutlined style={{ color: "#52c41a" }} />;
    }
    return <FileOutlined />;
  };

  const hasAttachment = (record: TeacherPermit) => {
    return !!(
      record.attachment &&
      record.attachment !== "null" &&
      record.attachment !== "" &&
      record.attachment.trim() !== ""
    );
  };

  const getFileCount = (record: TeacherPermit) => {
    if (!hasAttachment(record)) return 0;
    return record.attachment!.split(",").length;
  };

  const columns = [
    {
      title: "No",
      key: "no",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Periode Izin",
      key: "date",
      render: (_: any, record: TeacherPermit) => (
        <Space direction="vertical" size={0}>
          <Text strong>{dayjs(record.startDate).format("DD MMMM YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            s/d {dayjs(record.endDate).format("DD MMMM YYYY")}
          </Text>
        </Space>
      ),
      sorter: (a: TeacherPermit, b: TeacherPermit) =>
        dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
    },
    {
      title: "Jenis Izin",
      key: "type",
      render: (_: any, record: TeacherPermit) => (
        <Space>
          {getPermitIcon(record.type)}
          <Text>{record.typeLabel}</Text>
        </Space>
      ),
    },
    {
      title: "Alasan",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {text && text.length > 50
              ? `${text.substring(0, 50)}...`
              : text || "-"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Lampiran",
      key: "attachment",
      render: (_: any, record: TeacherPermit) => {
        const hasAttach = hasAttachment(record);

        return hasAttach ? (
          <Space>
            <Tooltip title="Lihat Lampiran">
              <Button
                type="link"
                icon={getFileIcon(record.attachment || undefined)}
                onClick={() => handlePreviewAttachment(record)}
                size="small"
              >
                Lihat
              </Button>
            </Tooltip>
          </Space>
        ) : (
          <Tag icon={<FileOutlined />} color="default">
            Tidak ada
          </Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: TeacherPermit) => {
        const statusColor =
          record.status === "approved"
            ? "success"
            : record.status === "rejected"
              ? "error"
              : "warning";
        return <Tag color={statusColor}>{record.statusLabel}</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "action",
      render: (_: any, record: TeacherPermit) => (
        <Space>
          {record.status === "pending" && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  style={{ color: token.colorWarning }}
                />
              </Tooltip>
              <Popconfirm
                title="Batalkan Pengajuan"
                description="Apakah Anda yakin ingin membatalkan pengajuan ini?"
                onConfirm={() => handleCancelPermit(record.id)}
                okText="Ya"
                cancelText="Tidak"
              >
                <Tooltip title="Batalkan">
                  <Button type="link" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const stats = useMemo(
    () => ({
      total: permits.length,
      pending: permits.filter((p) => p.status === "pending").length,
      approved: permits.filter((p) => p.status === "approved").length,
      rejected: permits.filter((p) => p.status === "rejected").length,
    }),
    [permits],
  );

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
            Pengajuan Perizinan Guru
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola pengajuan izin, cuti, dinas, dan WFH
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchPermits}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            size="middle"
          >
            Ajukan Izin Baru
          </Button>
        </Space>
      </Flex>

      {}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "all",
            label: `Semua (${stats.total})`,
          },
          {
            key: "pending",
            label: `Menunggu (${stats.pending})`,
          },
          {
            key: "approved",
            label: `Disetujui (${stats.approved})`,
          },
          {
            key: "rejected",
            label: `Ditolak (${stats.rejected})`,
          },
        ]}
      />

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
            placeholder="Jenis Izin"
            allowClear
            style={{ width: 130 }}
            onChange={(value) => setFilters({ ...filters, type: value })}
          >
            <Option value="sick">
              <Space size={4}>
                <span>Sakit</span>
              </Space>
            </Option>
            <Option value="leave">
              <Space size={4}>
                <span>Cuti</span>
              </Space>
            </Option>
            <Option value="business">
              <Space size={4}>
                <span>Dinas</span>
              </Space>
            </Option>
            <Option value="remote">
              <Space size={4}>
                <span>WFH</span>
              </Space>
            </Option>
          </Select>

          <RangePicker
            placeholder={["Tgl Mulai", "Tgl Selesai"]}
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  dateRange: [
                    dates[0]!.format("YYYY-MM-DD"),
                    dates[1]!.format("YYYY-MM-DD"),
                  ],
                });
              } else {
                setFilters({ ...filters, dateRange: undefined });
              }
            }}
          />

          <Input
            prefix={<SearchOutlined />}
            placeholder="Cari alasan izin..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />

          {(filters.type || filters.dateRange || searchText) && (
            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
              Reset Filter
            </Button>
          )}
        </Space>

        <Text type="secondary">
          Menampilkan {filteredPermits.length} dari {permits.length} data
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredPermits}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} pengajuan`,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: isSmallScreen ? 900 : undefined }}
        />
      </Spin>

      {}
      <Modal
        title={
          <Space>
            <Text strong>Ajukan Izin Baru</Text>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setFileList([]);
          setSelectedPermitType("");
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="type"
            label="Jenis Izin"
            rules={[{ required: true, message: "Pilih jenis izin" }]}
          >
            <Select
              placeholder="Pilih jenis izin"
              onChange={handlePermitTypeChange}
            >
              <Option value="sick">
                <Space>Sakit (wajib surat dokter)</Space>
              </Option>
              <Option value="leave">
                <Space>Cuti (wajib surat cuti)</Space>
              </Option>
              <Option value="business">
                <Space>Dinas / Tugas Luar (wajib surat tugas)</Space>
              </Option>
              <Option value="remote">
                <Space>WFH / Belajar Dari Rumah (wajib 2 foto)</Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Periode Izin"
            rules={[{ required: true, message: "Pilih periode izin" }]}
          >
            <RangePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder={["Mulai", "Selesai"]}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Alasan"
            rules={[
              { required: true, message: "Masukkan alasan izin" },
              { min: 10, message: "Alasan minimal 10 karakter" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Jelaskan alasan pengajuan izin secara detail..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {selectedPermitType && (
            <Form.Item
              label="Lampiran"
              required={attachmentReq.required}
              help={attachmentReq.message}
              extra={
                (selectedPermitType === "business" ||
                  selectedPermitType === "remote") && (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    Minimal upload 2 file untuk dokumen pendukung
                  </Text>
                )
              }
            >
              <Upload {...uploadProps}>
                <Button icon={<CameraOutlined />}>Upload File</Button>
              </Upload>
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setIsModalVisible(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Kirim
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {}
      <Modal
        title={<Text strong>Edit Pengajuan Izin</Text>}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditFileList([]);
          setSelectedPermit(null);
          setEditPermitType("");
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="type"
            label="Jenis Izin"
            rules={[{ required: true, message: "Pilih jenis izin" }]}
          >
            <Select
              placeholder="Pilih jenis izin"
              onChange={handleEditPermitTypeChange}
              disabled={selectedPermit?.status !== "pending"}
            >
              <Option value="sick">
                <Space>Sakit (wajib surat dokter)</Space>
              </Option>
              <Option value="leave">
                <Space>Cuti (wajib surat cuti)</Space>
              </Option>
              <Option value="business">
                <Space>Dinas / Tugas Luar (wajib surat tugas)</Space>
              </Option>
              <Option value="remote">
                <Space>WFH / Belajar Dari Rumah (wajib 2 foto)</Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Periode Izin"
            rules={[{ required: true, message: "Pilih periode izin" }]}
          >
            <RangePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder={["Mulai", "Selesai"]}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Alasan"
            rules={[
              { required: true, message: "Masukkan alasan izin" },
              { min: 10, message: "Alasan minimal 10 karakter" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Jelaskan alasan pengajuan izin secara detail..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {editPermitType && (
            <Form.Item
              label="Lampiran"
              required={editAttachmentReq.required}
              help={editAttachmentReq.message}
              extra={
                (editPermitType === "business" ||
                  editPermitType === "remote") && (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    Minimal upload 2 file untuk dokumen pendukung
                  </Text>
                )
              }
            >
              <Upload {...editUploadProps}>
                <Button icon={<CameraOutlined />}>Upload File</Button>
              </Upload>
              {editFileList.some((f) => f.url) && (
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginTop: 8 }}
                >
                  File yang sudah ada akan tetap disimpan. Upload file baru
                  untuk mengganti.
                </Text>
              )}
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  editForm.resetFields();
                  setEditFileList([]);
                  setSelectedPermit(null);
                  setEditPermitType("");
                }}
              >
                Batal
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={editSubmitting}
                icon={<SaveOutlined />}
              >
                Simpan
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <Text strong>Detail Pengajuan Izin</Text>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          selectedPermit?.status === "pending" && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setIsDetailModalVisible(false);
                if (selectedPermit) handleEdit(selectedPermit);
              }}
              style={{ backgroundColor: token.colorWarning }}
            >
              Edit
            </Button>
          ),
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={700}
      >
        {selectedPermit && (
          <Descriptions bordered column={1} style={{ marginTop: 16 }}>
            <Descriptions.Item label="Jenis Izin">
              <Space>
                {getPermitIcon(selectedPermit.type)}
                <Text strong>{selectedPermit.typeLabel}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Periode Izin">
              {dayjs(selectedPermit.startDate).format("DD MMMM YYYY")} s/d{" "}
              {dayjs(selectedPermit.endDate).format("DD MMMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Total Hari">
              <Tag color="blue">
                {dayjs(selectedPermit.endDate).diff(
                  dayjs(selectedPermit.startDate),
                  "day",
                ) + 1}{" "}
                Hari
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Alasan">
              <Paragraph
                style={{
                  backgroundColor: token.colorFillSecondary,
                  padding: 12,
                  borderRadius: token.borderRadiusLG,
                  marginBottom: 0,
                }}
              >
                {selectedPermit.reason}
              </Paragraph>
            </Descriptions.Item>

            {selectedPermit.attachmentUrls &&
              selectedPermit.attachmentUrls.length > 0 && (
                <Descriptions.Item label="Lampiran">
                  <Space>
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreviewAttachment(selectedPermit)}
                    >
                      Lihat Lampiran ({getFileCount(selectedPermit)} file)
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadAttachment(selectedPermit)}
                    >
                      Unduh Semua
                    </Button>
                  </Space>
                </Descriptions.Item>
              )}

            <Descriptions.Item label="Status">
              <Tag
                color={
                  selectedPermit.status === "approved"
                    ? "success"
                    : selectedPermit.status === "rejected"
                      ? "error"
                      : "warning"
                }
              >
                {selectedPermit.statusLabel}
              </Tag>
            </Descriptions.Item>
            {selectedPermit.rejectionReason && (
              <Descriptions.Item label="Alasan Ditolak">
                <Text type="danger">{selectedPermit.rejectionReason}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Tanggal Pengajuan">
              {dayjs(selectedPermit.createdAt).format("DD MMMM YYYY HH:mm")}
            </Descriptions.Item>
            {selectedPermit.updatedAt !== selectedPermit.createdAt && (
              <Descriptions.Item label="Terakhir Diupdate">
                {dayjs(selectedPermit.updatedAt).format("DD MMMM YYYY HH:mm")}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {}
      <Modal
        title={`Preview Lampiran - ${selectedPermit?.typeLabel || "Guru"}`}
        open={isAttachmentModalVisible}
        onCancel={() => {
          setIsAttachmentModalVisible(false);
          setPreviewFiles(null);
        }}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (selectedPermit) handleDownloadAttachment(selectedPermit);
            }}
          >
            Unduh
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setIsAttachmentModalVisible(false);
              setPreviewFiles(null);
            }}
          >
            Tutup
          </Button>,
        ]}
        width={900}
      >
        {previewFiles && previewFiles.length > 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {previewFiles.length === 1 ? (
              <>
                {previewFiles[0].type === "image" && (
                  <Image
                    src={previewFiles[0].url}
                    alt="Lampiran Izin"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "500px",
                      objectFit: "contain",
                    }}
                    preview={true}
                  />
                )}
                {previewFiles[0].type === "pdf" && (
                  <iframe
                    src={previewFiles[0].url}
                    title="PDF Preview"
                    style={{ width: "100%", height: "500px", border: "none" }}
                  />
                )}
                {previewFiles[0].type === "other" && (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <FileOutlined
                      style={{ fontSize: 64, color: token.colorPrimary }}
                    />
                    <Paragraph style={{ marginTop: 16 }}>
                      File tidak dapat dipreview langsung.
                      <br />
                      Silakan klik tombol Unduh untuk melihat file.
                    </Paragraph>
                  </div>
                )}
              </>
            ) : (
              <div>
                <Text style={{ marginBottom: 16, display: "block" }}>
                  Total {previewFiles.length} lampiran
                </Text>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  {previewFiles.map((file, index) => (
                    <Col key={index} xs={24} sm={12} md={8}>
                      <Card
                        hoverable
                        cover={
                          file.type === "image" ? (
                            <img
                              alt={`Lampiran ${index + 1}`}
                              src={file.url}
                              style={{
                                height: 200,
                                objectFit: "cover",
                                width: "100%",
                              }}
                            />
                          ) : file.type === "pdf" ? (
                            <div
                              style={{
                                height: 200,
                                backgroundColor: token.colorFillSecondary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <FilePdfOutlined
                                style={{
                                  fontSize: 48,
                                  color: token.colorError,
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                height: 200,
                                backgroundColor: token.colorFillSecondary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <FileOutlined
                                style={{
                                  fontSize: 48,
                                  color: token.colorTextSecondary,
                                }}
                              />
                            </div>
                          )
                        }
                        size="small"
                        onClick={() => window.open(file.url, "_blank")}
                        style={{ cursor: "pointer" }}
                      >
                        <Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                          ellipsis
                        >
                          Lampiran {index + 1} ({file.extension.toUpperCase()})
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  Klik pada lampiran untuk membukanya di tab baru
                </Paragraph>
              </div>
            )}
          </div>
        ) : (
          <Empty description="Tidak ada lampiran" />
        )}
      </Modal>
    </div>
  );
};

export default TeacherPermit;
