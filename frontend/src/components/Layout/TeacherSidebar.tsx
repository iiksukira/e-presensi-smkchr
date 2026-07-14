/** @format */

import React, { useMemo, useEffect, useState } from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  CalendarOutlined,
  BellOutlined,
  ClockCircleOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import type { MenuProps } from "antd";
import "./TeacherSidebar.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Sider } = Layout;

interface TeacherSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  collapsed = false,
  mobileVisible = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
        key: "/teacher/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => {
          navigate("/teacher/dashboard");
          if (isMobile && onCloseMobile) onCloseMobile();
        },
      },
      {
        key: "/teacher/profile",
        icon: <UserOutlined />,
        label: "Profil",
        onClick: () => {
          navigate("/teacher/profile");
          if (isMobile && onCloseMobile) onCloseMobile();
        },
      },
      {
        type: "group",
        label: "Absensi",
        children: [
          {
            key: "/teacher/attendance",
            icon: <CheckCircleOutlined />,
            label: "Absensi Kelas",
            onClick: () => {
              navigate("/teacher/attendance");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/teacher/self-attendance",
            icon: <UserOutlined />,
            label: "Absensi Diri",
            onClick: () => {
              navigate("/teacher/self-attendance");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/teacher/history",
            icon: <ClockCircleOutlined />,
            label: "Riwayat Absensi",
            onClick: () => {
              navigate("/teacher/history");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Jadwal & Pengumuman",
        children: [
          {
            key: "/teacher/schedule",
            icon: <CalendarOutlined />,
            label: "Jadwal Mengajar",
            onClick: () => {
              navigate("/teacher/schedule");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/teacher/announcement",
            icon: <FileTextOutlined />,
            label: "Pengumuman",
            onClick: () => {
              navigate("/teacher/announcement");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Izin",
        children: [
          {
            key: "/teacher/teacher-permit",
            icon: <FormOutlined />,
            label: "Izin Pribadi",
            onClick: () => {
              navigate("/teacher/teacher-permit");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
          {
            key: "/teacher/student-permit",
            icon: <FileTextOutlined />,
            label: "Izin Siswa",
            onClick: () => {
              navigate("/teacher/student-permit");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Biometrik",
        children: [
          {
            key: "/teacher/register-face",
            icon: <CameraOutlined />,
            label: "Daftar Wajah",
            onClick: () => {
              navigate("/teacher/register-face");
              if (isMobile && onCloseMobile) onCloseMobile();
            },
          },
        ],
      },
      {
        type: "group",
        label: "Notifikasi",
        children: [
          {
            key: "/teacher/notifications",
            icon: <BellOutlined />,
            label: "Notifikasi",
            onClick: () => {
              navigate("/teacher/notifications");
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
    if (path.startsWith("/teacher")) {
      for (const item of menuItems) {
        if (item && typeof item === "object" && "key" in item) {
          if (item.key === path) return item.key;
        }
      }
    }
    return "/teacher/dashboard";
  }, [location.pathname, menuItems]);

  if (isMobile && !mobileVisible) {
    return null;
  }

  return (
    <>
      {isMobile && mobileVisible && (
        <div className="teacher-sidebar-overlay" onClick={handleOverlayClick} />
      )}
      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        className={`teacher-sidebar ${isMobile ? "teacher-sidebar-mobile" : ""} ${mobileVisible ? "teacher-sidebar-open" : ""}`}
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
        <div className="teacher-sidebar-logo">
          <div className="teacher-sidebar-logo-inner">
            <img
              src={LogoSMK}
              alt="Logo"
              className="teacher-sidebar-logo-img"
            />
            <span className="teacher-sidebar-logo-text">E-Absen SMKCHR</span>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey as string]}
          items={menuItems}
          className="teacher-sidebar-menu"
        />
      </Sider>
    </>
  );
};

export default TeacherSidebar;
