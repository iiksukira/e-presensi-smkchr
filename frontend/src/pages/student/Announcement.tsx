/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Spin,
  Button,
  message,
  Flex,
  theme,
  Grid,
  Empty,
  Tag,
  Space,
  Divider,
  Badge,
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../../api/instance";
import { usePageTitle } from "../../utils/usePageTitle";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface Announcement {
  id: number;
  title: string;
  content: string;
  teacher_name: string;
  created_at: string;
  updated_at: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message || fallback;
  }

  return fallback;
};

const AnnouncementStudent: React.FC = () => {
  usePageTitle("Pengumuman");
  const { token } = useToken();
  const screens = useBreakpoint();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const isSmallScreen = !screens.md;

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/student/announcements");
      setAnnouncements(res.data);
      if (res.data.length === 0) {
        message.info("Belum ada pengumuman untuk kelas Anda");
      }
    } catch (error) {
      message.error(getErrorMessage(error, "Gagal memuat data pengumuman"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpdated = (created_at: string, updated_at: string) => {
    return new Date(created_at).getTime() !== new Date(updated_at).getTime();
  };

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
            Pengumuman
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Informasi dan pengumuman penting dari guru dan sekolah
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchAnnouncements}
          loading={loading}
          size="medium"
          style={{
            backgroundColor: token.colorPrimary,
            color: token.colorTextLightSolid,
          }}
        >
          Refresh
        </Button>
      </Flex>

      {}
      <Spin spinning={loading}>
        {announcements.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tidak ada pengumuman terbaru"
            style={{ marginTop: 80, marginBottom: 80 }}
          />
        ) : (
          <Flex
            justify="space-between"
            align={isSmallScreen ? "flex-start" : "center"}
            vertical={isSmallScreen}
            gap={16}
            style={{ marginBottom: 24 }}
          >
            {announcements.map((announcement, index) => (
              <Card
                key={announcement.id}
                hoverable
                style={{
                  borderLeft: `4px solid ${token.colorPrimary}`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    token.boxShadow;
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    token.boxShadow;
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                }}
              >
                {}
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={16}
                  vertical={isSmallScreen}
                  style={{ marginBottom: 12 }}
                >
                  <div style={{ flex: 1 }}>
                    <Flex gap={8} align="center">
                      <Badge
                        count={index + 1}
                        style={{
                          backgroundColor: token.colorPrimary,
                          fontSize: 12,
                          width: 24,
                          height: 24,
                          lineHeight: "24px",
                        }}
                      />
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          color: token.colorTextHeading,
                          flex: 1,
                        }}
                      >
                        {announcement.title}
                      </Title>
                    </Flex>
                  </div>
                  {isUpdated(
                    announcement.created_at,
                    announcement.updated_at,
                  ) && (
                    <Tag color="orange" style={{ marginTop: 4 }}>
                      Diperbarui
                    </Tag>
                  )}
                </Flex>

                <Divider style={{ margin: "12px 0" }} />

                {}
                <Paragraph
                  ellipsis={{ rows: 3 }}
                  style={{
                    marginBottom: 12,
                    color: token.colorTextSecondary,
                    lineHeight: 1.6,
                  }}
                >
                  {announcement.content}
                </Paragraph>

                {}
                <Flex
                  justify="space-between"
                  align="center"
                  gap={16}
                  vertical={isSmallScreen}
                  style={{
                    paddingTop: 12,
                    borderTop: `1px solid ${token.colorBorder}`,
                  }}
                >
                  <Space size={16} wrap>
                    <Space size={4}>
                      <UserOutlined
                        style={{ color: token.colorPrimary, fontSize: 12 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {announcement.teacher_name || "Guru"}
                      </Text>
                    </Space>

                    <Space size={4}>
                      <CalendarOutlined
                        style={{ color: token.colorSuccess, fontSize: 12 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDate(announcement.created_at)}
                      </Text>
                    </Space>
                  </Space>

                  <Button
                    type="text"
                    size="small"
                    style={{ color: token.colorPrimary }}
                  >
                    Baca Selengkapnya →
                  </Button>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Spin>
    </div>
  );
};

export default AnnouncementStudent;
