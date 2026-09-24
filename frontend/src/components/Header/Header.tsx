/** @format */

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import "./Header.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Header: AntHeader } = Layout;
const MOBILE_BREAKPOINT = 768;

interface HeaderProps {
  defaultName: string;
  defaultRole: string;
  loginPath: string;
  profilePath?: string;
  settingsPath: string;
  notificationPath?: string;
  notificationCount?: number;
  includeChildMenu?: boolean;
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

interface UserData {
  name?: string;
  full_name?: string;
  role?: string;
  childName?: string;
  unread_notifications?: number;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
  "orang tua": "Orang Tua",
  parent: "Orang Tua",
};

const Header: React.FC<HeaderProps> = ({
  defaultName,
  defaultRole,
  loginPath,
  profilePath,
  settingsPath,
  notificationPath,
  notificationCount,
  includeChildMenu = false,
  collapsed = false,
  mobileVisible = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= MOBILE_BREAKPOINT,
  );

  const user = useMemo<UserData>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userName = user.full_name || user.name || defaultName;
  const userRole = user.role || defaultRole;
  const normalizedRole = userRole.toLowerCase();
  const roleLabel = roleLabels[normalizedRole] || userRole || defaultRole;
  const unreadCount = notificationCount ?? user.unread_notifications ?? 0;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
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
        navigate(loginPath);
      },
    });
  }, [loginPath, navigate]);

  const menuItems = useMemo<MenuProps["items"]>(() => {
    const items: MenuProps["items"] = [];

    if (profilePath) {
      items.push({
        key: "profile",
        icon: <UserOutlined />,
        label: "Profil Saya",
        onClick: () => navigate(profilePath),
      });
    } else {
      items.push({
        key: "profile",
        icon: <UserOutlined />,
        label: "Profil Saya",
      });
    }

    if (includeChildMenu) {
      items.push({
        key: "child",
        icon: <UserOutlined />,
        label: `Data ${user.childName || "Anak"}`,
        onClick: () => navigate("/parent/child-data"),
      });
    }

    items.push(
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Pengaturan",
        onClick: () => navigate(settingsPath),
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Keluar",
        danger: true,
        onClick: handleLogout,
      },
    );

    return items;
  }, [
    handleLogout,
    includeChildMenu,
    navigate,
    profilePath,
    settingsPath,
    user.childName,
  ]);

  const toggleButtonIcon = isMobile ? (
    mobileVisible ? (
      <CloseOutlined />
    ) : (
      <MenuUnfoldOutlined />
    )
  ) : collapsed ? (
    <MenuUnfoldOutlined />
  ) : (
    <MenuFoldOutlined />
  );

  return (
    <AntHeader className="app-header">
      <div className="app-header-container">
        <div className="app-header-left">
          <Button
            type="text"
            className="app-header-toggle-btn"
            icon={toggleButtonIcon}
            onClick={onToggleSidebar}
            aria-label={mobileVisible ? "Tutup menu" : "Buka menu"}
          />
          <img src={LogoSMK} alt="Logo SMK" className="app-header-logo" />
          <div className="app-header-brand">
            <span className="app-header-title">SMKS CAHAYA RAYA BLANAKAN</span>
            <span className="app-header-subtitle">{roleLabel} Panel</span>
          </div>
        </div>

        <div className="app-header-right">
          <Space size="middle">
            {notificationPath && (
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined className="app-header-icon" />}
                  onClick={() => navigate(notificationPath)}
                  className="app-header-button"
                />
              </Badge>
            )}

            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="app-header-user">
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  className="app-header-avatar"
                  style={{ backgroundColor: "#2368a2" }}
                >
                  {!user.name && userName.charAt(0).toUpperCase()}
                </Avatar>
                <div className="app-header-user-info">
                  <span className="app-header-username">{userName}</span>
                  <span className="app-header-role">{roleLabel}</span>
                </div>
              </div>
            </Dropdown>
          </Space>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;
