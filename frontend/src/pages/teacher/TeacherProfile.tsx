

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Descriptions,
  Button,
  Form,
  Input,
  message,
  Spin,
  Row,
  Col,
  Avatar,
  Space,
  Empty,
  theme,
  Tag,
} from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

interface TeacherProfileData {
  id: number;
  fullName: string;
  nip: string;
  email?: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  specialization?: string;
}

interface UserSession {
  id: number;
  full_name: string;
  role: string;
  email?: string;
}

const FORM_RULES = {
  fullName: [
    { required: true, message: "Nama lengkap harus diisi" },
    { min: 3, message: "Nama lengkap minimal 3 karakter" },
  ],
  nip: [
    { required: true, message: "NIP harus diisi" },
    { pattern: /^[0-9]+$/, message: "NIP hanya boleh berisi angka" },
  ],
  email: [{ type: "email" as const, message: "Format email tidak valid" }],
  phone: [
    { pattern: /^[0-9+\-\s()]*$/, message: "Format telepon tidak valid" },
  ],
  address: [{ max: 255, message: "Alamat maksimal 255 karakter" }],
  specialization: [{ max: 100, message: "Keahlian maksimal 100 karakter" }],
};

const DEFAULT_PROFILE: TeacherProfileData = {
  id: 0,
  fullName: "",
  nip: "",
};

const TeacherProfile: React.FC = () => {
  usePageTitle("Profil Guru");
  const { token } = theme.useToken();
  const [editForm] = Form.useForm();

  const [profileData, setProfileData] = useState<TeacherProfileData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  
  const renderField = (
    value: string | undefined,
    fallback: string = "Belum ditambahkan",
  ) => {
    return (
      value || (
        <span style={{ color: token.colorTextSecondary }}>{fallback}</span>
      )
    );
  };

  const renderDescriptions = (
    items: Array<{ label: string; value: React.ReactNode }>,
  ) => (
    <Descriptions bordered={false} column={1} size="middle" layout="vertical">
      {items.map((item, index) => (
        <Descriptions.Item
          key={index}
          label={item.label}
          labelStyle={{ fontWeight: 600 }}
        >
          {item.value}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );

  
  const fetchTeacherProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<TeacherProfileData>("/teacher/profile");
      setProfileData(data);
      editForm.setFieldsValue({
        fullName: data.fullName,
        nip: data.nip,
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        specialization: data.specialization || "",
      });
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengambil data profil guru",
      );
    } finally {
      setLoading(false);
    }
  }, [editForm]);

  
  const handleEditClick = () => setIsEditMode(true);

  const handleCancelEdit = () => {
    setIsEditMode(false);
    editForm.resetFields();
  };

  const handleSaveProfile = async (values: any) => {
    setSubmitting(true);
    try {
      setProfileData((prev) => ({
        ...(prev || DEFAULT_PROFILE),
        ...values,
      }));
      message.success("Profil berhasil diperbarui");
      setIsEditMode(false);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal memperbarui profil guru",
      );
    } finally {
      setSubmitting(false);
    }
  };

  
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userData = sessionStorage.getItem("user");

    if (!token || !userData) {
      window.location.href = "/teacher/login";
      return;
    }

    const parsedUser = JSON.parse(userData) as UserSession;
    if (parsedUser.role !== "guru") {
      window.location.href = "/teacher/login";
      return;
    }

    fetchTeacherProfile();
  }, [fetchTeacherProfile]);

  
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" tip="Memuat data profil..." />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Data profil tidak ditemukan" />
      </div>
    );
  }

  
  const initials = profileData.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  
  const renderProfileCard = () => (
    <Card>
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Avatar
          size={120}
          style={{
            backgroundColor: token.colorPrimary,
            fontSize: 48,
          }}
        >
          {initials}
        </Avatar>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: "8px 0", color: "#222222" }}>
            {profileData.fullName}
          </h2>
          <p style={{ margin: "4px 0", fontSize: 14, opacity: 0.9 }}>
            {profileData.nip}
          </p>
          {profileData.specialization && (
            <p style={{ margin: "4px 0", fontSize: 14, opacity: 0.9 }}>
              Keahlian: {profileData.specialization}
            </p>
          )}
        </div>

        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEditClick}
          disabled={isEditMode}
          block
        >
          Edit Profil
        </Button>
      </Space>
    </Card>
  );

  const renderPersonalInfo = () => {
    const items = [
      { label: "Nama Lengkap", value: profileData.fullName },
      { label: "NIP", value: renderField(profileData.nip, "-") },
      { label: "Email", value: renderField(profileData.email) },
      { label: "Telepon", value: renderField(profileData.phone) },
      { label: "Alamat", value: renderField(profileData.address) },
      {
        label: "Keahlian/Spesialisasi",
        value: renderField(profileData.specialization),
      },
    ];

    if (profileData.joinDate) {
      items.push({
        label: "Bergabung Sejak",
        value: dayjs(profileData.joinDate).format("DD MMMM YYYY"),
      });
    }

    return <Card title="Informasi Pribadi">{renderDescriptions(items)}</Card>;
  };

  const renderAdditionalInfo = () => (
    <Card title="Informasi Tambahan" style={{ marginTop: 24 }}>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="User ID">{profileData.id}</Descriptions.Item>
        <Descriptions.Item label="Role">
          <Tag color="blue">Guru</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color="green">Aktif</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const renderEditForm = () => (
    <Card title="Edit Profil">
      <Form
        form={editForm}
        layout="vertical"
        onFinish={handleSaveProfile}
        autoComplete="off"
      >
        <Form.Item
          label="Nama Lengkap"
          name="fullName"
          rules={FORM_RULES.fullName}
        >
          <Input placeholder="Masukkan nama lengkap" />
        </Form.Item>

        <Form.Item label="NIP" name="nip" rules={FORM_RULES.nip}>
          <Input placeholder="Masukkan NIP" />
        </Form.Item>

        <Form.Item label="Email" name="email" rules={FORM_RULES.email}>
          <Input type="email" placeholder="Masukkan email" />
        </Form.Item>

        <Form.Item label="Telepon" name="phone" rules={FORM_RULES.phone}>
          <Input placeholder="Masukkan nomor telepon" />
        </Form.Item>

        <Form.Item label="Alamat" name="address" rules={FORM_RULES.address}>
          <Input.TextArea placeholder="Masukkan alamat" rows={3} />
        </Form.Item>

        <Form.Item
          label="Keahlian/Spesialisasi"
          name="specialization"
          rules={FORM_RULES.specialization}
        >
          <Input placeholder="Misalnya: Matematika, IPA, dll" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
            >
              Simpan Perubahan
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancelEdit}
              disabled={submitting}
            >
              Batal
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  
  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {}
        <Col xs={24} sm={24} md={8}>
          {renderProfileCard()}
        </Col>

        {}
        <Col xs={24} sm={24} md={16}>
          {!isEditMode ? (
            <>
              {renderPersonalInfo()}
              {renderAdditionalInfo()}
            </>
          ) : (
            renderEditForm()
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TeacherProfile;
