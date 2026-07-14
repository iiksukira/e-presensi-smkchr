/** @format */

import React, { useMemo, useEffect, useState } from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  CameraOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import type { MenuProps } from "antd";
import "./StudentSidebar.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Sider } = Layout;

interface StudentSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({
  collapsed = false,
  mobileVisible = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

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

  const handleOverlayClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "/student/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => {
          navigate("/student/dashboard");
          if (isMobile && onCloseMobile) onCloseMobile();
        },
      },
      {
        key: "/student/profile",
        icon: <UserOutlined />,
        label: "Profil",
        onClick: () => {
          navigate("/student/profile");
          if (isMobile && onCloseMobile) onCloseMobile();
        },
      },
      {
        type: "group",
        label: "Akademik",
        children: [
          {
            key: "/student/schedule",
            icon: <CalendarOutlined />,
            label: "Jadwal Pelajaran",
            onClick: () => {
              navigate("/student/schedule");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/student/self-attendance",
            icon: <CheckCircleOutlined />,
            label: "Absensi Mandiri",
            onClick: () => {
              navigate("/student/self-attendance");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/student/attendance-history",
            icon: <ClockCircleOutlined />,
            label: "Riwayat Absensi",
            onClick: () => {
              navigate("/student/attendance-history");
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
            key: "/student/announcements",
            icon: <FileTextOutlined />,
            label: "Pengumuman",
            onClick: () => {
              navigate("/student/announcements");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Lainnya",
        children: [
          {
            key: "/student/register-face",
            icon: <CameraOutlined />,
            label: "Daftar Wajah",
            onClick: () => {
              navigate("/student/register-face");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/student/permission",
            icon: <FileTextOutlined />,
            label: "Izin Siswa",
            onClick: () => {
              navigate("/student/permission");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "divider",
      },
    ],
    [navigate, isMobile, onCloseMobile, user.unread_notifications],
  );

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/student")) {
      for (const item of menuItems) {
        if (item && typeof item === "object" && "key" in item) {
          if (item.key === path) return item.key as string;
        }
      }
    }
    return "/student/dashboard";
  }, [location.pathname, menuItems]);

  if (isMobile && !mobileVisible) {
    return null;
  }

  const siderClassName = `student-sidebar ${
    isMobile && mobileVisible ? "student-sidebar-open" : ""
  } ${collapsed ? "ant-layout-sider-collapsed" : ""}`.trim();

  return (
    <>
      {isMobile && mobileVisible && (
        <div className="student-sidebar-overlay" onClick={handleOverlayClick} />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        className={siderClassName}
        theme="light"
        style={{
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          height: "100vh",
          zIndex: isMobile ? 1000 : 100,
          transition: "left 0.3s ease",
          ...(isMobile && {
            left: mobileVisible ? "0" : "-250px",
          }),
        }}
      >
        <div className="student-sidebar-logo">
          <div className="student-sidebar-logo-inner">
            <img
              src={LogoSMK}
              alt="Logo"
              className="student-sidebar-logo-img"
            />
            <span className="student-sidebar-logo-text">E-Absen SMKCHR</span>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="student-sidebar-menu"
        />
      </Sider>
    </>
  );
};

export default StudentSidebar;
