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
  Tag,
  Input,
  Empty,
  Spin,
  Popconfirm,
  Image,
  Row,
  Col,
  Tooltip,
  Select,
  DatePicker,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
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

interface FilterParams {
  status?: string;
  type?: string;
  dateRange?: [string, string];
  search?: string;
}

interface TeacherPermit {
  id: number;
  teacherId: number;
  teacherName: string;
  nip: string;
  subject?: string;
  type: "sakit" | "cuti" | "dinas" | "wfh";
  typeLabel: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: string;
  attachmentUrls?: string[];
  status: "pending" | "approved" | "rejected";
  statusLabel: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const PermissionAdmin: React.FC = () => {
  usePageTitle("Kelola Izin Guru");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permits, setPermits] = useState<TeacherPermit[]>([]);
  const [filteredPermits, setFilteredPermits] = useState<TeacherPermit[]>([]);
  const [selectedPermit, setSelectedPermit] = useState<TeacherPermit | null>(
    null,
  );
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

  const fileBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

  const isSmallScreen = !screens.md;

  const fetchPermits = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/teacher-permits");

      const processedPermits = response.data.map((permit: any) => ({
        ...permit,
        attachmentUrls: permit.attachment ? permit.attachment.split(",") : [],
      }));

      setPermits(processedPermits);
      setFilteredPermits(processedPermits);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengambil data izin guru",
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
          p.teacherName.toLowerCase().includes(search) ||
          p.nip.includes(search) ||
          p.reason.toLowerCase().includes(search),
      );
    }

    setFilteredPermits(filtered);
  }, [permits, activeTab, filters, searchText]);

  const handleApprove = async (id: number) => {
    setSubmitting(true);
    try {
      await api.put(`/admin/teacher-permits/${id}/approve`);
      message.success("Izin guru berhasil disetujui");
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
      await api.put(`/admin/teacher-permits/${id}/reject`, {
        rejection_reason: rejectionReason,
      });
      message.success("Izin guru ditolak");
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
        name: `Lampiran_${permit.teacherName}`,
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

  const resetFilters = () => {
    setFilters({});
    setSearchText("");
    setActiveTab("all");
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "approved":
        return <Tag color="success">Disetujui</Tag>;
      case "rejected":
        return <Tag color="error">Ditolak</Tag>;
      default:
        return <Tag color="warning">Menunggu</Tag>;
    }
  };

  const hasAttachment = (record: TeacherPermit) => {
    return !!(
      record.attachment &&
      record.attachment !== "null" &&
      record.attachment !== "" &&
      record.attachment.trim() !== ""
    );
  };

  const columns: ColumnsType<TeacherPermit> = [
    {
      title: "No",
      key: "no",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Guru",
      key: "teacher",
      width: 200,
      render: (_: any, record: TeacherPermit) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{record.teacherName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            NIP: {record.nip}
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.teacherName.localeCompare(b.teacherName),
    },
    {
      title: "Jenis Izin",
      key: "type",
      width: 140,
      render: (_: any, record: TeacherPermit) => (
        <Space>
          <Text>{record.typeLabel}</Text>
        </Space>
      ),
      filters: [
        { text: "Sakit", value: "sick" },
        { text: "Cuti", value: "leave" },
        { text: "Dinas", value: "business" },
        { text: "WFH", value: "remote" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Periode",
      key: "period",
      width: 180,
      render: (_: any, record: TeacherPermit) => (
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
      render: (_: any, record: TeacherPermit) => (
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
      render: (_: any, record: TeacherPermit) => {
        const hasAttach = hasAttachment(record);

        return hasAttach ? (
          <Space>
            <Tooltip title="Lihat Lampiran">
              <Button
                type="link"
                onClick={() => handlePreviewAttachment(record)}
                size="small"
              >
                Lihat
              </Button>
            </Tooltip>
          </Space>
        ) : (
          <Tag color="default">Tidak ada</Tag>
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
      render: (_, record) => (
        <Space>
          {record.status === "pending" && (
            <>
              <Popconfirm
                title="Setujui Izin"
                description={`Setujui izin ${record.teacherName}?`}
                onConfirm={() => handleApprove(record.id)}
                okText="Ya"
                cancelText="Tidak"
              >
                <Button
                  type="link"
                  style={{ color: token.colorSuccess }}
                  size="small"
                >
                  Izin
                </Button>
              </Popconfirm>
              <Button
                type="link"
                danger
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
            Perizinan Guru
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola pengajuan izin dari guru, termasuk persetujuan dan penolakan
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
            <Option value="Sakit">Sakit</Option>
            <Option value="Cuti">Cuti</Option>
            <Option value="Dinas">Dinas</Option>
            <Option value="WFH">WFH</Option>
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
            placeholder="Cari nama/NIP/alasan..."
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
          scroll={{ x: 1200 }}
        />
      </Spin>

      {}
      <Modal
        title={`Preview Lampiran - ${selectedPermit?.teacherName || "Guru"}`}
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
        title="Tolak Pengajuan Izin Guru"
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
            Tolak pengajuan izin dari guru{" "}
            <Text strong>{selectedPermit?.teacherName}</Text>?
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

export default PermissionAdmin;
