

import React, { useState, useEffect } from "react";
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
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

interface StudentProfileData {
  id: number;
  fullName: string;
  username: string;
  nisn: string;
  classId: number;
  className: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
}

interface UserSession {
  id: number;
  full_name: string;
  role: string;
}

const StudentProfile: React.FC = () => {
  usePageTitle("Profil Siswa");
  const { token } = theme.useToken();
  const [editForm] = Form.useForm();
  const [profileData, setProfileData] = useState<StudentProfileData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userData = sessionStorage.getItem("user");

    if (!token || !userData) {
      window.location.href = "/student/login";
      return;
    }

    const parsedUser = JSON.parse(userData) as UserSession;
    if (parsedUser.role !== "siswa") {
      window.location.href = "/student/login";
      return;
    }

    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/student/profile");
      setProfileData(data);
      editForm.setFieldsValue({
        fullName: data.fullName,
        username: data.username,
        nisn: data.nisn,
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        dateOfBirth: data.dateOfBirth || "",
        fatherName: data.fatherName || "",
        motherName: data.motherName || "",
      });
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal mengambil data profil siswa",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => setIsEditMode(true);

  const handleCancelEdit = () => {
    setIsEditMode(false);
    editForm.resetFields();
  };

  const handleSaveProfile = async (values: any) => {
    setSubmitting(true);
    try {
      setProfileData((prev) => ({
        ...(prev || {
          id: 0,
          fullName: "",
          username: "",
          nisn: "",
          classId: 0,
          className: "",
        }),
        ...values,
      }));
      message.success("Profil berhasil diperbarui");
      setIsEditMode(false);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal memperbarui profil siswa",
      );
    } finally {
      setSubmitting(false);
    }
  };

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

  const renderField = (
    value: string | undefined,
    fallback: string = "Belum ditambahkan",
  ) =>
    value || (
      <span style={{ color: token.colorTextSecondary }}>{fallback}</span>
    );

  const renderContact = (icon: React.ReactNode, value: string | undefined) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {React.cloneElement(icon as React.ReactElement, {})}
      <span>{renderField(value)}</span>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {}
        <Col xs={24} sm={24} md={8}>
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
                  {profileData.username}
                </p>
                {profileData.className && (
                  <p style={{ margin: "4px 0", fontSize: 14, opacity: 0.9 }}>
                    Kelas: {profileData.className}
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

          {}
          <Card title="Informasi Kontak" style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {renderContact(<MailOutlined />, profileData.email)}
              {renderContact(<PhoneOutlined />, profileData.phone)}
              {renderContact(<EnvironmentOutlined />, profileData.address)}
            </Space>
          </Card>
        </Col>

        {}
        <Col xs={24} sm={24} md={16}>
          {!isEditMode ? (
            <>
              <Card title="Informasi Akademik">
                <Descriptions
                  bordered={false}
                  column={1}
                  size="middle"
                  layout="vertical"
                >
                  <Descriptions.Item
                    label="Nama Lengkap"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {profileData.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Username"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {profileData.username}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="NISN"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {renderField(profileData.nisn, "-")}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Kelas"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {renderField(profileData.className, "-")}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Informasi Pribadi" style={{ marginTop: 24 }}>
                <Descriptions
                  bordered={false}
                  column={1}
                  size="middle"
                  layout="vertical"
                >
                  <Descriptions.Item
                    label="Email"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {renderField(profileData.email)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Telepon"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {renderField(profileData.phone)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Alamat"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {renderField(profileData.address)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Tanggal Lahir"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {profileData.dateOfBirth
                      ? dayjs(profileData.dateOfBirth).format("DD MMMM YYYY")
                      : renderField(undefined)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Informasi Orangtua" style={{ marginTop: 24 }}>
                <Descriptions
                  bordered={false}
                  column={1}
                  size="middle"
                  layout="vertical"
                >
                  <Descriptions.Item
                    label="Nama Ayah"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {renderField(profileData.fatherName)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Nama Ibu"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {renderField(profileData.motherName)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </>
          ) : (
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
                  rules={[
                    { required: true, message: "Nama lengkap harus diisi" },
                    { min: 3, message: "Nama lengkap minimal 3 karakter" },
                  ]}
                >
                  <Input placeholder="Masukkan nama lengkap" />
                </Form.Item>

                <Form.Item
                  label="Username"
                  name="username"
                  rules={[
                    { required: true, message: "Username harus diisi" },
                    { min: 3, message: "Username minimal 3 karakter" },
                  ]}
                >
                  <Input placeholder="Masukkan username" />
                </Form.Item>

                <Form.Item
                  label="NISN"
                  name="nisn"
                  rules={[
                    { required: true, message: "NISN harus diisi" },
                    {
                      pattern: /^[0-9]+$/,
                      message: "NISN hanya boleh berisi angka",
                    },
                    { len: 10, message: "NISN harus 10 digit" },
                  ]}
                >
                  <Input placeholder="Masukkan NISN (10 digit)" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { type: "email", message: "Format email tidak valid" },
                  ]}
                >
                  <Input type="email" placeholder="Masukkan email" />
                </Form.Item>

                <Form.Item
                  label="Telepon"
                  name="phone"
                  rules={[
                    {
                      pattern: /^[0-9+\-\s()]*$/,
                      message: "Format telepon tidak valid",
                    },
                  ]}
                >
                  <Input placeholder="Masukkan nomor telepon" />
                </Form.Item>

                <Form.Item
                  label="Alamat"
                  name="address"
                  rules={[
                    { max: 255, message: "Alamat maksimal 255 karakter" },
                  ]}
                >
                  <Input.TextArea placeholder="Masukkan alamat" rows={3} />
                </Form.Item>

                <Form.Item label="Tanggal Lahir" name="dateOfBirth">
                  <Input type="date" placeholder="Pilih tanggal lahir" />
                </Form.Item>

                <Form.Item
                  label="Nama Ayah"
                  name="fatherName"
                  rules={[
                    { max: 100, message: "Nama ayah maksimal 100 karakter" },
                  ]}
                >
                  <Input placeholder="Masukkan nama ayah" />
                </Form.Item>

                <Form.Item
                  label="Nama Ibu"
                  name="motherName"
                  rules={[
                    { max: 100, message: "Nama ibu maksimal 100 karakter" },
                  ]}
                >
                  <Input placeholder="Masukkan nama ibu" />
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
          )}

          {}
          <Card title="Informasi Tambahan" style={{ marginTop: 24 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="User ID">
                {profileData.id}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color="blue">Siswa</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">Aktif</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile;
