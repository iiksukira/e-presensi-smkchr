/** @format */

import React, { useCallback, useEffect, useState } from "react";
import { Layout, Button, Space, Avatar, Dropdown, Badge, Modal } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";
import "./TeacherHeader.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Header } = Layout;

interface TeacherHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  collapsed = false,
  mobileVisible = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const userName = user?.full_name || user?.name || "Guru";
  const userRole = user?.role || "Guru";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = useCallback((): void => {
    Modal.confirm({
      title: "Konfirmasi Logout",
      content: "Apakah anda yakin keluar dari aplikasi?",
      okText: "Ya",
      cancelText: "Batal",
      okType: "danger",
      onOk() {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/teacher/login");
      },
    });
  }, [navigate]);

  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profil Saya",
      onClick: () => navigate("/teacher/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Pengaturan",
      onClick: () => navigate("/teacher/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Keluar",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const getAvatarColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "#2368a2";
      case "guru":
        return "#8c9600";
      case "siswa":
        return "#7dba00";
      case "orang tua":
      case "parent":
        return "#910000";
      default:
        return "#2368a2";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "Administrator";
      case "guru":
        return "Guru";
      case "siswa":
        return "Siswa";
      case "orang tua":
      case "parent":
        return "Orang Tua";
      default:
        return role || "Guru";
    }
  };

  const handleToggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <Header className="teacher-header">
      <div className="teacher-header-container">
        <div className="teacher-header-left">
          <Button
            type="text"
            className="student-header-toggle-btn"
            icon={
              isMobile ? (
                mobileVisible ? (
                  <CloseOutlined />
                ) : (
                  <MenuUnfoldOutlined />
                )
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={handleToggleSidebar}
            aria-label={mobileVisible ? "Tutup menu" : "Buka menu"}
          />
          <img src={LogoSMK} alt="Logo SMK" className="teacher-header-logo" />
          <div className="teacher-header-brand">
            <span className="teacher-header-title">
              SMKS CAHAYA RAYA BLANAKAN
            </span>
            <span className="teacher-header-subtitle">
              {getRoleLabel(userRole)} Panel
            </span>
          </div>
        </div>

        <div className="teacher-header-right">
          <Space size="middle">
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined className="teacher-header-icon" />}
                onClick={() => navigate("/teacher/notifications")}
                className="teacher-header-button"
              />
            </Badge>

            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="teacher-header-user">
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  className="teacher-header-avatar"
                  style={{ backgroundColor: getAvatarColor(userRole) }}
                >
                  {!user?.name && userName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div className="teacher-header-user-info">
                  <span className="teacher-header-username">{userName}</span>
                  <span className="teacher-header-role">
                    {getRoleLabel(userRole)}
                  </span>
                </div>
              </div>
            </Dropdown>
          </Space>
        </div>
      </div>
    </Header>
  );
};

export default TeacherHeader;
