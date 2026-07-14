/** @format */

import React, { useMemo, useEffect } from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  FileTextOutlined,
  CameraOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LockOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import type { MenuProps } from "antd";
import "./AdminSidebar.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Sider } = Layout;

interface AdminSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  mobileVisible = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onCloseMobile]);

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "/admin",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => {
          navigate("/admin");
          if (isMobile && onCloseMobile) onCloseMobile();
        },
      },
      {
        type: "group",
        label: "Manajemen Data",
        children: [
          {
            key: "/admin/manage-students",
            icon: <UserOutlined />,
            label: "Kelola Siswa",
            onClick: () => {
              navigate("/admin/manage-students");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/admin/manage-teachers",
            icon: <TeamOutlined />,
            label: "Kelola Guru",
            onClick: () => {
              navigate("/admin/manage-teachers");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/admin/manage-classes",
            icon: <BookOutlined />,
            label: "Kelola Kelas",
            onClick: () => {
              navigate("/admin/manage-classes");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/admin/manage-parents",
            icon: <UsergroupAddOutlined />,
            label: "Kelola Orang Tua",
            onClick: () => {
              navigate("/admin/manage-parents");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Jadwal & Izin",
        children: [
          {
            key: "/admin/schedule",
            icon: <CalendarOutlined />,
            label: "Jadwal Mengajar",
            onClick: () => {
              navigate("/admin/schedule");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/admin/permissions",
            icon: <LockOutlined />,
            label: "Kelola Izin",
            onClick: () => {
              navigate("/admin/permissions");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Laporan & Monitoring",
        children: [
          {
            key: "/admin/reports",
            icon: <FileTextOutlined />,
            label: "Laporan Absensi",
            onClick: () => {
              navigate("/admin/reports");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/admin/biometrics",
            icon: <CameraOutlined />,
            label: "Manajemen Wajah",
            onClick: () => {
              navigate("/admin/biometrics");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Sistem",
        children: [
          {
            key: "/admin/settings",
            icon: <SettingOutlined />,
            label: "Pengaturan",
            onClick: () => {
              navigate("/admin/settings");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "divider",
      },
    ],
    [navigate, isMobile, onCloseMobile],
  );

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path === "/admin" || path === "/dashboard") return "/admin";
    if (path.startsWith("/admin")) {
      for (const item of menuItems) {
        if (item && typeof item === "object" && "key" in item) {
          if (item.key === path) return item.key;
        }
      }
    }
    return "/admin";
  }, [location.pathname, menuItems]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileVisible && (
        <div className="admin-sidebar-overlay" onClick={onCloseMobile} />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        className={`admin-sidebar ${isMobile ? "admin-sidebar-mobile" : ""} ${mobileVisible ? "admin-sidebar-open" : ""}`}
        theme="light"
        style={{
          position: isMobile ? "fixed" : "sticky",
          left: isMobile ? (mobileVisible ? 0 : "-250px") : 0,
          top: 0,
          height: "100vh",
          zIndex: isMobile ? 1000 : 100,
          transition: "left 0.3s ease",
        }}
      >
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-inner">
            <img src={LogoSMK} alt="Logo" className="admin-sidebar-logo-img" />
            <span className="admin-sidebar-logo-text">E-Absen SMKCHR</span>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey as string]}
          items={menuItems}
          className="admin-sidebar-menu"
        />
      </Sider>
    </>
  );
};

export default AdminSidebar;
