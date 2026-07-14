/** @format */

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Flex,
  theme,
  Grid,
  Modal,
  message,
  Descriptions,
  Badge,
  Tag,
  Select,
  DatePicker,
  Input,
  Empty,
  Spin,
  Popconfirm,
  Row,
  Col,
  Tabs,
  Tooltip,
  Avatar,
  Image,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  CarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface StudentPermit {
  id: number;
  studentId: number;
  studentName: string;
  nisn: string;
  className: string;
  type: "sick" | "leave" | "business" | "remote";
  typeLabel: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: string | null;
  attachmentUrl?: string | null;
  status: "pending" | "approved" | "rejected";
  statusLabel: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterParams {
  status?: string;
  type?: string;
  dateRange?: [string, string];
  search?: string;
}

const StudentPermit: React.FC = () => {
  usePageTitle("Kelola Izin Siswa");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permits, setPermits] = useState<StudentPermit[]>([]);
  const [filteredPermits, setFilteredPermits] = useState<StudentPermit[]>([]);
  const [selectedPermit, setSelectedPermit] = useState<StudentPermit | null>(
    null,
  );
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<FilterParams>({});
  const [searchText, setSearchText] = useState("");
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

  const isSmallScreen = !screens.md;

  const fetchPermits = async () => {
    setLoading(true);
    try {
      const response = await api.get("/teacher/student-permits");
      setPermits(response.data);
      setFilteredPermits(response.data);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengambil data izin siswa",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermits();
  }, []);

  useEffect(() => {
    let filtered = [...permits];

    if (activeTab !== "all") {
      filtered = filtered.filter((p) => p.status === activeTab);
    }

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter((p) => p.type === filters.type);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter((p) => {
        const permitDate = dayjs(p.createdAt);
        return (
          permitDate.isAfter(dayjs(start)) &&
          permitDate.isBefore(dayjs(end).add(1, "day"))
        );
      });
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.studentName.toLowerCase().includes(search) ||
          p.nisn.includes(search) ||
          p.className.toLowerCase().includes(search),
      );
    }

    setFilteredPermits(filtered);
  }, [permits, activeTab, filters, searchText]);

  const handleApprove = async (id: number) => {
    setSubmitting(true);
    try {
      await api.put(`/teacher/student-permits/${id}/approve`);
      message.success("Izin siswa berhasil disetujui");
      fetchPermits();
      setSelectedPermit(null);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Gagal menyetujui izin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason.trim()) {
      message.warning("Silakan masukkan alasan penolakan");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/teacher/student-permits/${id}/reject`, {
        rejection_reason: rejectionReason,
      });
      message.success("Izin siswa ditolak");
      fetchPermits();
      setIsRejectModalVisible(false);
      setRejectionReason("");
      setSelectedPermit(null);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Gagal menolak izin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = (permit: StudentPermit) => {
    setSelectedPermit(permit);
    setIsDetailModalVisible(true);
  };

  const handlePreviewAttachment = (permit: StudentPermit) => {
    const attachmentUrl = permit.attachment || permit.attachmentUrl;

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
        name: `Lampiran_${permit.studentName}`,
        extension: fileExtension,
      };
    });

    setPreviewFiles(files);
    setIsAttachmentModalVisible(true);
  };

  const handleDownloadAttachment = async (permit: StudentPermit) => {
    const attachmentUrl = permit.attachment || permit.attachmentUrl;

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

  const resetFilters = () => {
    setFilters({});
    setSearchText("");
    setActiveTab("all");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge status="success" text="Disetujui" />;
      case "rejected":
        return <Badge status="error" text="Ditolak" />;
      default:
        return <Badge status="warning" text="Menunggu" />;
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Disetujui
          </Tag>
        );
      case "rejected":
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Ditolak
          </Tag>
        );
      default:
        return (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            Menunggu
          </Tag>
        );
    }
  };

  const getPermitIcon = (type: string) => {
    switch (type) {
      case "sick":
        return <MedicineBoxOutlined style={{ color: token.colorError }} />;
      case "leave":
        return <HomeOutlined style={{ color: token.colorWarning }} />;
      case "business":
        return <CarOutlined style={{ color: token.colorPrimary }} />;
      case "remote":
        return <ClockCircleOutlined style={{ color: token.colorSuccess }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getFileIcon = (url?: string | null) => {
    if (!url || url === "null" || url === "") return <FileOutlined />;
    const extension = url.split(".").pop()?.toLowerCase();
    if (extension === "pdf")
      return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <FileImageOutlined style={{ color: "#52c41a" }} />;
    }
    return <FileOutlined />;
  };

  const hasAttachment = (record: StudentPermit) => {
    const attachment = record.attachment || record.attachmentUrl;
    return !!(attachment && attachment !== "null" && attachment !== "");
  };

  const columns: ColumnsType<StudentPermit> = [
    {
      title: "No",
      key: "no",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Siswa",
      key: "student",
      width: 200,
      render: (_: any, record: StudentPermit) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{record.studentName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.nisn} • {record.className}
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.studentName.localeCompare(b.studentName),
    },
    {
      title: "Jenis Izin",
      key: "type",
      width: 120,
      render: (_: any, record: StudentPermit) => (
        <Space>
          {getPermitIcon(record.type)}
          <Text>{record.typeLabel}</Text>
        </Space>
      ),
      filters: [
        { text: "Sakit", value: "sick" },
        { text: "Cuti", value: "leave" },
        { text: "Keperluan", value: "business" },
        { text: "BDR", value: "remote" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Periode",
      key: "period",
      width: 180,
      render: (_: any, record: StudentPermit) => (
        <Space orientation="vertical" size={0}>
          <Text>{dayjs(record.startDate).format("DD/MM/YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            s/d {dayjs(record.endDate).format("DD/MM/YYYY")}
          </Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
    },
    {
      title: "Alasan",
      key: "reason",
      width: 200,
      ellipsis: true,
      render: (_: any, record: StudentPermit) => (
        <Tooltip title={record.reason}>
          <Text ellipsis>
            {record.reason.length > 50
              ? `${record.reason.substring(0, 50)}...`
              : record.reason}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Lampiran",
      width: 120,
      render: (_: any, record: StudentPermit) => {
        const hasAttach = hasAttachment(record);

        return hasAttach ? (
          <Space orientation="vertical">
            <Tooltip title="Lihat Lampiran">
              <Button
                type="link"
                icon={getFileIcon(record.attachment || record.attachmentUrl)}
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
      title: "Tanggal Pengajuan",
      key: "createdAt",
      width: 150,
      render: (_, record) => dayjs(record.createdAt).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: "descend",
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_, record) => getStatusTag(record.status),
      filters: [
        { text: "Menunggu", value: "pending" },
        { text: "Disetujui", value: "approved" },
        { text: "Ditolak", value: "rejected" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Aksi",
      key: "action",
      width: 200,
      fixed: isSmallScreen ? false : "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            Detail
          </Button>
          {record.status === "pending" && (
            <>
              <Popconfirm
                title="Setujui Izin"
                description={`Setujui izin ${record.studentName}?`}
                onConfirm={() => handleApprove(record.id)}
                okText="Ya"
                cancelText="Tidak"
              >
                <Button
                  type="link"
                  icon={<CheckCircleOutlined />}
                  style={{ color: token.colorSuccess }}
                  size="small"
                >
                  Izin
                </Button>
              </Popconfirm>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setSelectedPermit(record);
                  setIsRejectModalVisible(true);
                }}
                size="small"
              >
                Tolak
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: permits.length,
    pending: permits.filter((p) => p.status === "pending").length,
    approved: permits.filter((p) => p.status === "approved").length,
    rejected: permits.filter((p) => p.status === "rejected").length,
  };

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
            Perizinan Siswa
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola pengajuan izin dari siswa
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchPermits}
          loading={loading}
        >
          Refresh
        </Button>
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
            <Option value="sick">Sakit</Option>
            <Option value="leave">Cuti</Option>
            <Option value="business">Keperluan</Option>
            <Option value="remote">BDR</Option>
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
            placeholder="Cari nama/NISN/kelas"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />

          {(filters.type || filters.dateRange || searchText) && (
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
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
          scroll={{ x: 1300 }}
        />
      </Spin>

      {}
      <Modal
        title={`Preview Lampiran - ${selectedPermit?.studentName || "Siswa"}`}
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

      {}
      <Modal
        title="Detail Pengajuan Izin Siswa"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedPermit(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Tutup
          </Button>,
          selectedPermit?.status === "pending" && (
            <Button
              key="approve"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ backgroundColor: token.colorSuccess }}
              onClick={() => {
                setIsDetailModalVisible(false);
                handleApprove(selectedPermit.id);
              }}
            >
              Setujui
            </Button>
          ),
          selectedPermit?.status === "pending" && (
            <Button
              key="reject"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setIsDetailModalVisible(false);
                setIsRejectModalVisible(true);
              }}
            >
              Tolak
            </Button>
          ),
        ]}
        width={700}
      >
        {selectedPermit && (
          <Descriptions
            bordered
            column={1}
            style={{ marginTop: 16 }}
            size="middle"
          >
            <Descriptions.Item label="Nama Siswa">
              <Space>
                <Avatar icon={<UserOutlined />} />
                <Text strong>{selectedPermit.studentName}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="NISN / Kelas">
              {selectedPermit.nisn} • {selectedPermit.className}
            </Descriptions.Item>
            <Descriptions.Item label="Jenis Izin">
              <Space>
                {getPermitIcon(selectedPermit.type)}
                {selectedPermit.typeLabel}
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
            {selectedPermit?.attachment && (
              <Descriptions.Item label="Lampiran">
                <Row gutter={[16, 16]}>
                  {selectedPermit.attachment.split(",").map((url, idx) => {
                    const trimmedUrl = url.trim();
                    const fullUrl = trimmedUrl.startsWith("http")
                      ? trimmedUrl
                      : `${import.meta.env.VITE_API_URL}${trimmedUrl}`;
                    const fileExtension = trimmedUrl
                      .split(".")
                      .pop()
                      ?.toLowerCase();
                    const isImage = [
                      "jpg",
                      "jpeg",
                      "png",
                      "gif",
                      "webp",
                    ].includes(fileExtension || "");
                    const isPdf = fileExtension === "pdf";

                    return (
                      <Col key={idx} xs={12} sm={8} md={6}>
                        <Card
                          hoverable
                          cover={
                            isImage ? (
                              <img
                                alt={`Lampiran ${idx + 1}`}
                                src={fullUrl}
                                style={{
                                  height: 120,
                                  objectFit: "cover",
                                  width: "100%",
                                }}
                                onClick={() => window.open(fullUrl, "_blank")}
                              />
                            ) : isPdf ? (
                              <div
                                style={{
                                  height: 120,
                                  backgroundColor: token.colorFillSecondary,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                                onClick={() => window.open(fullUrl, "_blank")}
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
                                  height: 120,
                                  backgroundColor: token.colorFillSecondary,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                                onClick={() => window.open(fullUrl, "_blank")}
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
                          style={{ cursor: "pointer" }}
                        >
                          <Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                            ellipsis
                          >
                            {fileExtension
                              ? `${fileExtension.toUpperCase()} - Lampiran ${
                                  idx + 1
                                }`
                              : `Lampiran ${idx + 1}`}
                          </Text>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              {getStatusBadge(selectedPermit.status)}
            </Descriptions.Item>
            {selectedPermit.rejectionReason && (
              <Descriptions.Item label="Alasan Ditolak">
                <Paragraph
                  style={{
                    color: token.colorError,
                    backgroundColor: token.colorErrorBg,
                    padding: 12,
                    borderRadius: token.borderRadiusLG,
                    marginBottom: 0,
                  }}
                >
                  {selectedPermit.rejectionReason}
                </Paragraph>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Tanggal Pengajuan">
              {dayjs(selectedPermit.createdAt).format("DD MMMM YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {}
      <Modal
        title="Tolak Pengajuan Izin"
        open={isRejectModalVisible}
        onCancel={() => {
          setIsRejectModalVisible(false);
          setRejectionReason("");
          setSelectedPermit(null);
        }}
        onOk={() => selectedPermit && handleReject(selectedPermit.id)}
        okText="Tolak"
        cancelText="Batal"
        okButtonProps={{ danger: true, loading: submitting }}
        width={500}
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Text>
            Tolak pengajuan izin dari siswa{" "}
            <Text strong>{selectedPermit?.studentName}</Text>?
          </Text>
          <Input.TextArea
            rows={4}
            placeholder="Masukkan alasan penolakan (wajib)..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            maxLength={200}
            showCount
          />
        </Space>
      </Modal>
    </div>
  );
};

export default StudentPermit;
