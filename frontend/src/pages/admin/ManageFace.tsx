/** @format */

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Typography,
  Tag,
  message,
  Popconfirm,
  Input,
  Select,
  theme,
  Flex,
  Grid,
  Modal,
  Space,
  Spin,
} from "antd";
import {
  ReloadOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface FaceData {
  user_id: number;
  full_name: string;
  role: string;
  has_face: boolean;
  face_image: string | null;
}

const FaceManagement: React.FC = () => {
  usePageTitle("Kelola Data Wajah");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [data, setData] = useState<FaceData[]>([]);
  const [filteredData, setFilteredData] = useState<FaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFace, setSelectedFace] = useState<{
    image: string;
    name: string;
  } | null>(null);

  const isSmallScreen = !screens.md;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/biometric-status");
      setData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      message.error("Gagal memuat status biometrik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...data];

    if (searchText) {
      filtered = filtered.filter((item) =>
        item.full_name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    if (filterRole) {
      filtered = filtered.filter((item) => item.role === filterRole);
    }

    setFilteredData(filtered);
  }, [searchText, filterRole, data]);

  const handleResetFace = async (userId: number) => {
    try {
      await api.post(`/admin/reset-face/${userId}`);
      message.success("Data wajah berhasil direset");
      fetchData();
    } catch (err) {
      message.error("Gagal mereset data wajah");
    }
  };

  const handleDeleteFace = async (userId: number) => {
    try {
      await api.post(`/admin/delete-face/${userId}`);
      message.success("Data biometrik berhasil dihapus");
      fetchData();
    } catch (err) {
      message.error("Gagal menghapus data biometrik");
    }
  };

  const handleViewFaceImage = (face_image: string, full_name: string) => {
    setSelectedFace({ image: face_image, name: full_name });
    setModalVisible(true);
  };

  const getFaceImageSrc = (face_image: string | null | undefined) => {
    if (!face_image) return "";
    return face_image.startsWith("data:image")
      ? face_image
      : `data:image/jpeg;base64,${face_image}`;
  };

  const columns = [
    {
      title: "Nama Lengkap",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "guru" ? token.colorPrimary : token.colorSuccess}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Status Biometrik",
      dataIndex: "has_face",
      key: "has_face",
      render: (has_face: boolean) =>
        has_face ? (
          <Tag color="success">Terdaftar</Tag>
        ) : (
          <Tag color="error">Belum Daftar</Tag>
        ),
    },
    {
      title: "Gambar Wajah",
      dataIndex: "face_image",
      key: "face_image",
      render: (face_image: string | null, record: FaceData) =>
        face_image ? (
          <img
            src={getFaceImageSrc(face_image)}
            alt="Face"
            style={{
              width: 60,
              height: 60,
              objectFit: "cover",
              borderRadius: 4,
              border: `1px solid ${token.colorBorder}`,
              cursor: "pointer",
            }}
            onClick={() => handleViewFaceImage(face_image, record.full_name)}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              backgroundColor: token.colorBgContainerDisabled,
              borderRadius: 4,
              border: `1px solid ${token.colorBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: 10 }}>
              Tidak Ada
            </Text>
          </div>
        ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 200,
      render: (_: any, record: FaceData) => (
        <Space>
          <Popconfirm
            title="Reset data wajah?"
            description="User harus melakukan pendaftaran wajah ulang setelah ini."
            onConfirm={() => handleResetFace(record.user_id)}
            disabled={!record.has_face}
          >
            <Button
              danger
              type="link"
              disabled={!record.has_face}
              icon={<ReloadOutlined />}
            >
              Reset
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Hapus data biometrik?"
            description="Data wajah dan gambar akan dihapus secara permanen."
            onConfirm={() => handleDeleteFace(record.user_id)}
            disabled={!record.has_face}
          >
            <Button
              danger
              type="link"
              disabled={!record.has_face}
              icon={<DeleteOutlined />}
            >
              Hapus
            </Button>
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
            Manajemen Biometrik Wajah
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola data wajah pengguna, termasuk reset dan penghapusan data
            biometrik
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
        >
          {" "}
          Refresh
        </Button>
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
          {" "}
          <Input
            placeholder="Cari nama pengguna..."
            prefix={<SearchOutlined style={{ color: token.colorPrimary }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="medium"
            allowClear
          />
          <Select
            placeholder="Filter Role"
            value={filterRole}
            onChange={setFilterRole}
            size="medium"
            allowClear
            style={{ width: "100%" }}
            options={[
              { label: "Guru", value: "guru" },
              { label: "Siswa", value: "siswa" },
            ]}
          />
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Menampilkan {filteredData.length} dari {data.length} pengguna
        </Text>
      </Flex>

      {}
      <Spin spinning={loading}>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="user_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          scroll={{ x: "max-content" }}
          style={{ marginTop: 0 }}
        />
      </Spin>

      {}
      <Modal
        title={`Gambar Wajah - ${selectedFace?.name}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        {selectedFace && (
          <div style={{ textAlign: "center" }}>
            <img
              src={getFaceImageSrc(selectedFace.image)}
              alt="Face"
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: 8,
                border: `1px solid ${token.colorBorder}`,
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FaceManagement;
