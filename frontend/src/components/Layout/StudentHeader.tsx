/** @format */

import React, { useCallback, useEffect, useState } from "react";
import {
  Layout,
  Button,
  Space,
  Avatar,
  Dropdown,
  Badge,
  type MenuProps,
  Modal,
} from "antd";
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
import "./StudentHeader.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Header } = Layout;

interface StudentHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({
  collapsed = false,
  mobileVisible = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const userName = user?.full_name || user?.name || "Siswa";
  const userRole = user?.role || "Siswa";

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
        navigate("/student/login");
      },
    });
  }, [navigate]);

  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: "Profil Saya",
      icon: <UserOutlined />,
      onClick: () => {
        navigate("/student/profile");
      },
    },
    {
      key: "settings",
      label: "Pengaturan",
      icon: <SettingOutlined />,
      onClick: () => {
        navigate("/student/settings");
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Keluar",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
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
        return role || "Siswa";
    }
  };

  const handleToggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <Header className="student-header">
      <div className="student-header-container">
        <div className="student-header-left">
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
          <img src={LogoSMK} alt="Logo SMK" className="student-header-logo" />
          <div className="student-header-brand">
            <span className="student-header-title">
              SMKS CAHAYA RAYA BLANAKAN
            </span>
            <span className="student-header-subtitle">
              {getRoleLabel(userRole)} Panel
            </span>
          </div>
        </div>

        <div className="student-header-right">
          <Space size="middle">
            <Badge count={user.unread_notifications || 0} size="small">
              <Button
                type="text"
                icon={<BellOutlined className="student-header-icon" />}
                onClick={() => {
                  navigate("/student/notifications");
                }}
                className="student-header-button"
              />
            </Badge>

            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="student-header-user">
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  className="student-header-avatar"
                  style={{ backgroundColor: getAvatarColor(userRole) }}
                >
                  {!user?.name && userName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div className="student-header-user-info">
                  <span className="student-header-username">{userName}</span>
                  <span className="student-header-role">
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

export default StudentHeader;
