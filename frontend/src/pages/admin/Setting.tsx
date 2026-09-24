/** @format */

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Tabs,
  Switch,
  InputNumber,
  message,
  Space,
  Typography,
  Flex,
  theme,
  Grid,
  TimePicker,
  Tag,
  Alert,
  Badge,
  Card,
} from "antd";
import {
  LockOutlined,
  BellOutlined,
  MonitorOutlined,
  CameraOutlined,
  LogoutOutlined,
  MailOutlined,
  MobileOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";
import LocationPicker from "../../components/LocationPicker";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

const Setting: React.FC = () => {
  usePageTitle("Pengaturan");
  const { token } = useToken();
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [attendanceLocationLat, setAttendanceLocationLat] =
    useState(-6.2744207);
  const [attendanceLocationLng, setAttendanceLocationLng] =
    useState(107.6503034);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);

  const isSmallScreen = !screens.md;

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      await api.put("/auth/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success("Password berhasil diubah");
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async (values: any) => {
    setLoading(true);
    try {
      const dataToSend = {
        ...values,
        attendanceStartTime: startTime
          ? startTime.format("HH:mm")
          : values.attendanceStartTime,
        attendanceEndTime: endTime
          ? endTime.format("HH:mm")
          : values.attendanceEndTime,
        attendanceLocationLat,
        attendanceLocationLng,
        notification_sound_duration: values.notificationSoundDuration || 30,
      };
      await api.put("/admin/settings", dataToSend);
      message.success("Pengaturan sistem berhasil disimpan");
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal menyimpan pengaturan",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = () => {
    message.info("Fitur notifikasi akan segera diimplementasikan");
  };

  const handleResetAllFaceData = () => {
    message.info("Fitur reset semua data wajah akan segera diimplementasikan");
  };

  const handleSaveThreshold = (value: number | null) => {
    if (value) {
      sessionStorage.setItem("faceRecognitionThreshold", value.toString());
      message.success(`Threshold disimpan: ${value}`);
    }
  };

  const parseTimeString = (timeStr: string): Dayjs | null => {
    if (!timeStr) return null;
    try {
      if (timeStr.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
        return dayjs(`2000-01-01 ${timeStr}`, "YYYY-MM-DD HH:mm");
      }
      if (timeStr.includes("T")) {
        const date = dayjs(timeStr);
        return dayjs(`2000-01-01 ${date.format("HH:mm")}`, "YYYY-MM-DD HH:mm");
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleStartTimeChange = (time: Dayjs | null) => {
    setStartTime(time);
    systemForm.setFieldValue("attendanceStartTime", time);
  };

  const handleEndTimeChange = (time: Dayjs | null) => {
    setEndTime(time);
    systemForm.setFieldValue("attendanceEndTime", time);
  };

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get("/admin/settings");
        const data = response.data;

        if (data.attendanceStartTime) {
          const parsedStartTime = parseTimeString(data.attendanceStartTime);
          if (parsedStartTime) {
            setStartTime(parsedStartTime);
            systemForm.setFieldsValue({ attendanceStartTime: parsedStartTime });
          }
        }

        if (data.attendanceEndTime) {
          const parsedEndTime = parseTimeString(data.attendanceEndTime);
          if (parsedEndTime) {
            setEndTime(parsedEndTime);
            systemForm.setFieldsValue({ attendanceEndTime: parsedEndTime });
          }
        }

        if (data.attendanceLocationLat) {
          setAttendanceLocationLat(data.attendanceLocationLat);
        }
        if (data.attendanceLocationLng) {
          setAttendanceLocationLng(data.attendanceLocationLng);
        }

        systemForm.setFieldsValue({
          toleranceMeters: data.toleranceMeters,
          toleranceMinutes: data.toleranceMinutes,
          enableNotifications: data.enableNotifications,
          autoLogoutTime: data.autoLogoutTime,
          notificationSoundDuration: data.notification_sound_duration || 30,
        });
      } catch (error: any) {
        message.warning(
          error.response?.data?.message ||
            "Gagal memuat pengaturan sistem. Gunakan nilai default.",
        );
      }
    };

    loadSettings();
  }, [systemForm]);

  const tabItems = [
    {
      key: "account",
      label: (
        <Space>
          <LockOutlined />
          <span>Akun & Keamanan</span>
        </Space>
      ),
      children: (
        <div>
          <Alert
            message="Keamanan Akun"
            description="Jaga keamanan akun Anda dengan mengganti password secara berkala"
            type="info"
          />

          <Card
            style={{
              marginTop: "10px",
            }}
          >
            <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  Ubah Password
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Gunakan password yang kuat dan unik untuk keamanan maksimal
                </Text>
              </div>
            </Flex>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="oldPassword"
                label="Password Lama"
                rules={[{ required: true, message: "Masukkan password lama" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Masukkan password lama"
                  style={{ borderRadius: token.borderRadiusLG }}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="Password Baru"
                rules={[
                  { required: true, message: "Masukkan password baru" },
                  { min: 6, message: "Password minimal 6 karakter" },
                ]}
                extra="Password minimal 6 karakter"
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Masukkan password baru"
                  style={{ borderRadius: token.borderRadiusLG }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Konfirmasi Password Baru"
                rules={[
                  { required: true, message: "Konfirmasi password baru" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Password konfirmasi tidak cocok"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Konfirmasi password baru"
                  style={{ borderRadius: token.borderRadiusLG }}
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Ubah Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: "system",
      label: (
        <Space>
          <MonitorOutlined />
          <span>Sistem Presensi</span>
        </Space>
      ),
      children: (
        <div>
          <Alert
            message="Konfigurasi Sistem"
            description="Atur parameter sistem presensi sesuai kebijakan sekolah"
            type="info"
          />
          <Card style={{ marginTop: "10px" }}>
            <Form
              form={systemForm}
              layout="vertical"
              onFinish={handleSaveSystemSettings}
            >
              <Form.Item
                name="attendanceStartTime"
                label={
                  <Space>
                    <span>Waktu Mulai Presensi</span>
                  </Space>
                }
                rules={[{ required: true, message: "Masukkan waktu mulai" }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{
                    width: "100%",
                  }}
                  value={startTime}
                  onChange={handleStartTimeChange}
                  placeholder="Pilih waktu mulai"
                />
              </Form.Item>

              <Form.Item
                name="attendanceEndTime"
                label={
                  <Space>
                    <span>Waktu Akhir Presensi</span>
                  </Space>
                }
                rules={[{ required: true, message: "Masukkan waktu akhir" }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{
                    width: "100%",
                  }}
                  value={endTime}
                  onChange={handleEndTimeChange}
                  placeholder="Pilih waktu akhir"
                />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <span>Koordinat Lokasi Presensi</span>
                  </Space>
                }
              >
                <LocationPicker
                  latitude={attendanceLocationLat}
                  longitude={attendanceLocationLng}
                  onLocationChange={(lat, lng) => {
                    setAttendanceLocationLat(lat);
                    setAttendanceLocationLng(lng);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="toleranceMeters"
                label={
                  <Space>
                    <span>Toleransi Jarak</span>
                  </Space>
                }
                rules={[
                  { required: true, message: "Masukkan toleransi jarak" },
                ]}
                extra="Jarak maksimal dari lokasi presensi (dalam meter) untuk dianggap hadir"
              >
                <InputNumber
                  min={0}
                  max={3000}
                  placeholder="100"
                  addonAfter="meter"
                  style={{
                    width: "100%",
                  }}
                />
              </Form.Item>
              <Form.Item
                name="toleranceMinutes"
                label={
                  <Space>
                    <span>Toleransi Keterlambatan</span>
                  </Space>
                }
                rules={[{ required: true, message: "Masukkan toleransi" }]}
                extra="Waktu toleransi setelah batas presensi"
              >
                <InputNumber
                  min={0}
                  max={60}
                  placeholder="15"
                  addonAfter="menit"
                  style={{
                    width: "100%",
                  }}
                />
              </Form.Item>
              <Form.Item
                name="autoLogoutTime"
                label={
                  <Space>
                    <LogoutOutlined />
                    <span>Auto Logout</span>
                  </Space>
                }
                rules={[
                  { required: true, message: "Masukkan waktu auto logout" },
                ]}
                extra="Waktu idle sebelum logout otomatis"
              >
                <InputNumber
                  min={5}
                  max={480}
                  placeholder="60"
                  addonAfter="menit"
                  style={{
                    width: "100%",
                  }}
                />
              </Form.Item>
              <Form.Item
                name="enableNotifications"
                label="Aktifkan Notifikasi"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Simpan Pengaturan
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: "face",
      label: (
        <Space>
          <CameraOutlined />
          <span>Face Recognition</span>
        </Space>
      ),
      children: (
        <div>
          <Alert
            message="Pengenalan Wajah"
            description="Konfigurasi sistem pengenalan wajah untuk presensi"
            type="success"
          />
          <Card style={{ marginTop: "10px" }}>
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Flex align="center" gap={12}>
                <Badge status="processing" />
                <div>
                  <Text strong>Status Model Face Recognition:</Text>
                  <br />
                  <Text type="secondary">
                    Model face landmark dan recognition telah dimuat dan siap
                    digunakan
                  </Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <Badge status="error" />
                <div>
                  <Text strong>Reset Face Data:</Text>
                  <br />
                  <Text type="secondary">
                    Gunakan fitur ini untuk mereset data wajah pengguna jika
                    diperlukan. Tindakan ini tidak dapat dibatalkan.
                  </Text>
                </div>
              </Flex>
              <Button danger onClick={handleResetAllFaceData}>
                Reset Semua Data Wajah
              </Button>

              <div>
                <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                  <div>
                    <Text strong>Konfigurasi Threshold:</Text>
                    <br />
                    <Text type="secondary">
                      Atur sensitivitas pengenalan wajah (0.1 - 1.0). Nilai
                      lebih rendah = lebih sensitif, nilai lebih tinggi = lebih
                      akurat.
                    </Text>
                  </div>
                </Flex>
                <InputNumber
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  defaultValue={0.6}
                  onChange={handleSaveThreshold}
                />
                <Tag color="blue" style={{ marginLeft: 12 }}>
                  Default: 0.6
                </Tag>
              </div>
            </Space>
          </Card>
        </div>
      ),
    },
    {
      key: "notifications",
      label: (
        <Space>
          <BellOutlined />
          <span>Notifikasi</span>
        </Space>
      ),
      children: (
        <div>
          <Alert
            message="Pengaturan Notifikasi"
            description="Atur preferensi notifikasi untuk monitoring presensi"
            type="warning"
          />
          <Card style={{ marginTop: "10px" }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div
                style={{
                  padding: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                }}
              >
                <Flex justify="space-between" align="center">
                  <Space>
                    <MailOutlined
                      style={{ fontSize: 18, color: token.colorPrimary }}
                    />
                    <div>
                      <Text strong>Notifikasi Email</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Kirim notifikasi via email untuk presensi terlambat
                      </Text>
                    </div>
                  </Space>
                  <Switch defaultChecked />
                </Flex>
              </div>

              <div
                style={{
                  padding: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                }}
              >
                <Flex justify="space-between" align="center">
                  <Space>
                    <MobileOutlined
                      style={{ fontSize: 18, color: token.colorSuccess }}
                    />
                    <div>
                      <Text strong>Notifikasi Push Jadwal Guru</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Kirim notifikasi push ke Jadwal mengajar guru
                      </Text>
                    </div>
                  </Space>
                  <Switch defaultChecked />
                </Flex>
              </div>
              <div
                style={{
                  padding: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                }}
              >
                <Flex justify="space-between" align="center">
                  <Space>
                    <MobileOutlined
                      style={{ fontSize: 18, color: token.colorSuccess }}
                    />
                    <div>
                      <Text strong>Notifikasi Push Jadwal Siswa</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Kirim notifikasi push ke Jadwal pelajaran siswa
                      </Text>
                    </div>
                  </Space>
                  <Switch defaultChecked />
                </Flex>
              </div>

              <div
                style={{
                  padding: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                }}
              >
                <Flex justify="space-between" align="center">
                  <Space>
                    <FileTextOutlined
                      style={{ fontSize: 18, color: token.colorWarning }}
                    />
                    <div>
                      <Text strong>Notifikasi Laporan Harian</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Kirim laporan presensi harian ke email admin
                      </Text>
                    </div>
                  </Space>
                  <Switch />
                </Flex>
              </div>

              <Button type="primary" onClick={handleSaveNotificationSettings}>
                Simpan Pengaturan Notifikasi
              </Button>
            </Space>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ textAlign: "left" }}>
      <Flex
        justify="space-between"
        align={isSmallScreen ? "flex-start" : "center"}
        vertical={isSmallScreen}
        gap={16}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Pengaturan
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kelola pengaturan akun dan konfigurasi sistem presensi
          </Text>
        </div>
      </Flex>

      <Tabs defaultActiveKey="account" items={tabItems} />
    </div>
  );
};

export default Setting;
