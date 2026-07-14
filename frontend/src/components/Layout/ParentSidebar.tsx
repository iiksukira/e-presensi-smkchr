/** @format */

import React, { useMemo, useEffect } from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BellOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import type { MenuProps } from "antd";
import "./ParentSidebar.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Sider } = Layout;

interface ParentSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const ParentSidebar: React.FC<ParentSidebarProps> = ({
  collapsed = false,
  mobileVisible = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const childName = user?.childName || "Anak";

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
        key: "/parent",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => {
          navigate("/parent");
          if (isMobile && onCloseMobile) onCloseMobile();
        },
      },
      {
        type: "group",
        label: "Data Anak",
        children: [
          {
            key: "/parent/child-data",
            icon: <UserOutlined />,
            label: `Data ${childName}`,
            onClick: () => {
              navigate("/parent/child-data");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/parent/attendance",
            icon: <CheckCircleOutlined />,
            label: "Riwayat Absensi",
            onClick: () => {
              navigate("/parent/attendance");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/parent/schedule",
            icon: <CalendarOutlined />,
            label: "Jadwal Pelajaran",
            onClick: () => {
              navigate("/parent/schedule");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Informasi",
        children: [
          {
            key: "/parent/announcements",
            icon: <BellOutlined />,
            label: "Pengumuman",
            onClick: () => {
              navigate("/parent/announcements");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/parent/reports",
            icon: <FileTextOutlined />,
            label: "Laporan Perkembangan",
            onClick: () => {
              navigate("/parent/reports");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Komunikasi",
        children: [
          {
            key: "/parent/messages",
            icon: <TeamOutlined />,
            label: "Pesan",
            onClick: () => {
              navigate("/parent/messages");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Pengaturan",
        children: [
          {
            key: "/parent/settings",
            icon: <SettingOutlined />,
            label: "Pengaturan",
            onClick: () => {
              navigate("/parent/settings");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "divider",
      },
    ],
    [navigate, isMobile, onCloseMobile, childName],
  );

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path === "/parent" || path === "/dashboard") return "/parent";
    if (path.startsWith("/parent")) {
      for (const item of menuItems) {
        if (item && typeof item === "object" && "key" in item) {
          if (item.key === path) return item.key;
        }
      }
    }
    return "/parent";
  }, [location.pathname, menuItems]);

  return (
    <>
      {isMobile && mobileVisible && (
        <div className="parent-sidebar-overlay" onClick={onCloseMobile} />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        className={`parent-sidebar ${isMobile ? "parent-sidebar-mobile" : ""} ${mobileVisible ? "parent-sidebar-open" : ""}`}
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
        <div className="parent-sidebar-logo">
          <div className="parent-sidebar-logo-inner">
            <img src={LogoSMK} alt="Logo" className="parent-sidebar-logo-img" />
            {!collapsed && (
              <span className="parent-sidebar-logo-text">E-Absen SMKCHR</span>
            )}
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey as string]}
          items={menuItems}
          className="parent-sidebar-menu"
        />
      </Sider>
    </>
  );
};

export default ParentSidebar;
