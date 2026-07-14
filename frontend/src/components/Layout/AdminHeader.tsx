/** @format */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Layout, Dropdown, Avatar, Button, Space, Modal } from "antd";
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";
import "./AdminHeader.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Header } = Layout;

const MOBILE_BREAKPOINT = 768;

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  guru: "Guru",
  siswa: "Siswa",
  "orang tua": "Orang Tua",
  parent: "Orang Tua",
};

const AVATAR_COLORS: Record<string, string> = {
  admin: "#2368a2",
  guru: "#8c9600",
  siswa: "#7dba00",
  "orang tua": "#910000",
  parent: "#910000",
};

interface AdminHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

interface UserData {
  name?: string;
  role?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  collapsed = false,
  mobileVisible = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState<boolean>(
    window.innerWidth <= MOBILE_BREAKPOINT,
  );

  const user = useMemo<UserData>(() => {
    try {
      const userData = sessionStorage.getItem("user");
      return userData ? JSON.parse(userData) : {};
    } catch {
      return {};
    }
  }, []);

  const userName = user?.name || "User";
  const userRole = user?.role || "User";

  const getRoleLabel = useCallback((role: string): string => {
    const normalizedRole = role?.toLowerCase() || "";
    return ROLE_LABELS[normalizedRole] || role || "User";
  }, []);

  const getAvatarColor = useCallback((role: string): string => {
    const normalizedRole = role?.toLowerCase() || "";
    return AVATAR_COLORS[normalizedRole] || AVATAR_COLORS.admin;
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
        navigate("/admin/login");
      },
    });
  }, [navigate]);

  const menuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profil Saya",
        // onClick: () => navigate("/admin/profile"),
      },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Pengaturan",
        onClick: () => navigate("/admin/settings"),
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
    ],
    [navigate, handleLogout],
  );

  useEffect(() => {
    const handleResize = (): void => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleButtonIcon = useMemo(() => {
    if (isMobile) {
      return mobileVisible ? <CloseOutlined /> : <MenuUnfoldOutlined />;
    }
    return collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />;
  }, [isMobile, mobileVisible, collapsed]);

  return (
    <Header className="admin-header">
      <div className="admin-header-container">
        {/* Left Section */}
        <div className="admin-header-left">
          <Button
            type="text"
            className="admin-header-toggle-btn"
            icon={toggleButtonIcon}
            onClick={onToggleSidebar}
            aria-label={isMobile ? "Toggle mobile menu" : "Toggle sidebar"}
          />

          <img
            src={LogoSMK}
            alt="Logo SMK Cahaya Raya Blanakan"
            className="admin-header-logo"
          />

          <div className="admin-header-brand">
            <span className="admin-header-title">
              SMKS CAHAYA RAYA BLANAKAN
            </span>
            <span className="admin-header-subtitle">
              {getRoleLabel(userRole)} Panel
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="admin-header-right">
          <Space size="middle">
            {/* User Dropdown */}
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div
                className="admin-header-user"
                role="button"
                tabIndex={0}
                aria-label="User menu"
              >
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  className="admin-header-avatar"
                  style={{ backgroundColor: getAvatarColor(userRole) }}
                >
                  {!user?.name && userName?.charAt(0)?.toUpperCase()}
                </Avatar>

                <div className="admin-header-user-info">
                  <span className="admin-header-username">{userName}</span>
                  <span className="admin-header-role">
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

export default AdminHeader;
