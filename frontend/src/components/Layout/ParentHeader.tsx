/** @format */

import React, { useCallback, useEffect, useState } from "react";
import { Layout, Dropdown, Avatar, Button, Space, Badge, Modal } from "antd";
import {
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";
import "./ParentHeader.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Header } = Layout;

interface ParentHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

const ParentHeader: React.FC<ParentHeaderProps> = ({
  collapsed = false,
  mobileVisible = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const userName = user?.full_name || user?.name || "Orang Tua";
  const userRole = user?.role || "Orang Tua";
  const childName = user?.childName || "Anak";

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
        navigate("/parent/login");
      },
    });
  }, [navigate]);

  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profil Saya",
      onClick: () => navigate("/parent/profile"),
    },
    {
      key: "child",
      icon: <UserOutlined />,
      label: `Data ${childName}`,
      onClick: () => navigate("/parent/child-data"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Pengaturan",
      onClick: () => navigate("/parent/settings"),
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
    <Header className="parent-header">
      <div className="parent-header-container">
        <div className="parent-header-left">
          <Button
            type="text"
            className="parent-header-toggle-btn"
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
            aria-label={mobileVisible ? "Tutup Menu" : "Buka Menu"}
          />
          <img src={LogoSMK} alt="Logo SMK" className="parent-header-logo" />
          <div className="parent-header-brand">
            <span className="parent-header-title">
              SMKS CAHAYA RAYA BLANAKAN
            </span>
            <span className="parent-header-subtitle">
              {getRoleLabel(userRole)} Panel
            </span>
          </div>
        </div>

        <div className="parent-header-right">
          <Space size="middle">
            <Badge count={user.unread_notifications || 0} size="small">
              <Button
                type="text"
                icon={<BellOutlined className="parent-header-icon" />}
                onClick={() => {
                  navigate("/parent/notifications");
                }}
                className="parent-header-button"
              />
            </Badge>

            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="parent-header-user">
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  className="parent-header-avatar"
                  style={{ backgroundColor: getAvatarColor(userRole) }}
                >
                  {!user?.name && userName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div className="parent-header-user-info">
                  <span className="parent-header-username">{userName}</span>
                  <span className="parent-header-role">
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

export default ParentHeader;
