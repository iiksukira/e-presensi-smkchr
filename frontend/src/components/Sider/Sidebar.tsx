/** @format */

import React, { useEffect, useMemo, useState } from "react";
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
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { type MenuProps } from "antd";
import "./Sidebar.css";
import LogoSMK from "../../assets/Logo SMK.png";

const { Sider } = Layout;
type MenuItem = Required<MenuProps>["items"][number];

export type SidebarRole = "admin" | "student" | "teacher" | "parent";

interface SidebarProps {
  role: SidebarRole;
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  collapsed = false,
  mobileVisible = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const user = useMemo(
    () => JSON.parse(sessionStorage.getItem("user") || "{}"),
    [],
  );
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

  const goTo = (path: string) => {
    navigate(path);
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  const menuItems: MenuProps["items"] = useMemo(() => {
    const item = (key: string, icon: React.ReactNode, label: string) => ({
      key,
      icon,
      label,
      onClick: () => goTo(key),
    });

    if (role === "admin") {
      return [
        item("/admin", <DashboardOutlined />, "Dashboard"),
        {
          key: "admin-data",
          icon: <BookOutlined />,
          label: "Data Master",
          children: [
            item("/admin/student-data", <UserOutlined />, "Siswa"),
            item("/admin/teacher-data", <UserOutlined />, "Guru"),
            item("/admin/manage-classes", <BookOutlined />, "Kelas & Jurusan"),
          ],
        },
        {
          key: "admin-accounts",
          icon: <TeamOutlined />,
          label: "Manajemen Akun",
          children: [
            item("/admin/manage-teachers", <TeamOutlined />, "Akun Guru"),
            item("/admin/manage-students", <UserOutlined />, "Akun Siswa"),
            item(
              "/admin/manage-parents",
              <UsergroupAddOutlined />,
              "Akun Orang Tua",
            ),
          ],
        },
        {
          key: "admin-schedule",
          icon: <CalendarOutlined />,
          label: "Jadwal & Izin",
          children: [
            item("/admin/schedule", <CalendarOutlined />, "Jadwal Mengajar"),
            item("/admin/permissions", <LockOutlined />, "Kelola Izin"),
          ],
        },
        {
          key: "admin-reports",
          icon: <FileTextOutlined />,
          label: "Laporan & Monitoring",
          children: [
            item("/admin/reports", <FileTextOutlined />, "Laporan Presensi"),
            item("/admin/biometrics", <CameraOutlined />, "Manajemen Wajah"),
          ],
        },
        {
          key: "admin-system",
          icon: <SettingOutlined />,
          label: "Sistem",
          children: [
            item("/admin/settings", <SettingOutlined />, "Pengaturan"),
          ],
        },
        { type: "divider" as const },
      ];
    }

    if (role === "student") {
      return [
        item("/student/dashboard", <DashboardOutlined />, "Dashboard"),
        item("/student/profile", <UserOutlined />, "Profil"),
        {
          key: "student-academic",
          icon: <BookOutlined />,
          label: "Akademik",
          children: [
            item("/student/schedule", <CalendarOutlined />, "Jadwal Pelajaran"),
            item(
              "/student/self-attendance",
              <CheckCircleOutlined />,
              "Presensi Mandiri",
            ),
            item(
              "/student/attendance-history",
              <ClockCircleOutlined />,
              "Riwayat Presensi",
            ),
          ],
        },
        {
          key: "student-information",
          icon: <FileTextOutlined />,
          label: "Informasi",
          children: [
            item("/student/announcements", <FileTextOutlined />, "Pengumuman"),
          ],
        },
        {
          key: "student-other",
          icon: <SettingOutlined />,
          label: "Lainnya",
          children: [
            item("/student/register-face", <CameraOutlined />, "Daftar Wajah"),
            item("/student/permission", <FileTextOutlined />, "Izin Siswa"),
          ],
        },
        { type: "divider" as const },
      ];
    }

    if (role === "teacher") {
      return [
        item("/teacher/dashboard", <DashboardOutlined />, "Dashboard"),
        item("/teacher/profile", <UserOutlined />, "Profil"),
        {
          key: "teacher-attendance",
          icon: <CheckCircleOutlined />,
          label: "Presensi",
          children: [
            item(
              "/teacher/attendance",
              <CheckCircleOutlined />,
              "Presensi Kelas",
            ),
            item("/teacher/self-attendance", <UserOutlined />, "Presensi Diri"),
            item(
              "/teacher/history",
              <ClockCircleOutlined />,
              "Riwayat Presensi",
            ),
          ],
        },
        {
          key: "teacher-schedule",
          icon: <CalendarOutlined />,
          label: "Jadwal & Pengumuman",
          children: [
            item("/teacher/schedule", <CalendarOutlined />, "Jadwal Mengajar"),
            item("/teacher/announcement", <FileTextOutlined />, "Pengumuman"),
          ],
        },
        {
          key: "teacher-permits",
          icon: <FormOutlined />,
          label: "Izin",
          children: [
            item("/teacher/teacher-permit", <FormOutlined />, "Izin Pribadi"),
            item("/teacher/student-permit", <FileTextOutlined />, "Izin Siswa"),
          ],
        },
        {
          key: "teacher-biometric",
          icon: <CameraOutlined />,
          label: "Biometrik",
          children: [
            item("/teacher/register-face", <CameraOutlined />, "Daftar Wajah"),
          ],
        },
        { type: "divider" as const },
      ];
    }

    return [
      item("/parent", <DashboardOutlined />, "Dashboard"),
      {
        key: "parent-child",
        icon: <UserOutlined />,
        label: "Data Anak",
        children: [
          item("/parent/child-data", <UserOutlined />, `Data ${childName}`),
          item(
            "/parent/attendance",
            <CheckCircleOutlined />,
            "Riwayat Presensi",
          ),
          item("/parent/schedule", <CalendarOutlined />, "Jadwal Pelajaran"),
        ],
      },
      {
        key: "parent-information",
        icon: <BellOutlined />,
        label: "Informasi",
        children: [
          item("/parent/announcements", <BellOutlined />, "Pengumuman"),
        ],
      },
      {
        key: "parent-communication",
        icon: <TeamOutlined />,
        label: "Komunikasi",
        children: [item("/parent/messages", <TeamOutlined />, "Pesan")],
      },
      {
        key: "parent-settings",
        icon: <SettingOutlined />,
        label: "Pengaturan",
        children: [item("/parent/settings", <SettingOutlined />, "Pengaturan")],
      },
      { type: "divider" as const },
    ];
  }, [childName, isMobile, navigate, onCloseMobile, role]);

  const levelKeys = useMemo(() => {
    const keys: Record<string, number> = {};
    const collect = (items: MenuItem[], level = 1) => {
      items.forEach((menuItem) => {
        if (!menuItem || typeof menuItem !== "object") return;
        if ("key" in menuItem && typeof menuItem.key === "string") {
          keys[menuItem.key] = level;
        }
        if ("children" in menuItem && Array.isArray(menuItem.children)) {
          collect(menuItem.children as MenuItem[], level + 1);
        }
      });
    };
    collect(menuItems.filter(Boolean) as MenuItem[]);
    return keys;
  }, [menuItems]);

  const parentKeys = useMemo(() => {
    const parents: Record<string, string[]> = {};
    const collect = (items: MenuItem[], ancestors: string[] = []) => {
      items.forEach((menuItem) => {
        if (!menuItem || typeof menuItem !== "object") return;
        const key =
          "key" in menuItem && typeof menuItem.key === "string"
            ? menuItem.key
            : undefined;
        const nextAncestors = key ? [...ancestors, key] : ancestors;
        if (key) parents[key] = ancestors;
        if ("children" in menuItem && Array.isArray(menuItem.children)) {
          collect(menuItem.children as MenuItem[], nextAncestors);
        }
      });
    };
    collect(menuItems.filter(Boolean) as MenuItem[]);
    return parents;
  }, [menuItems]);

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    const prefix = `/${role === "student" ? "student" : role === "teacher" ? "teacher" : role}`;
    if (path === prefix || (role === "admin" && path === "/dashboard")) {
      return prefix;
    }
    if (path.startsWith(prefix)) {
      for (const menuItem of menuItems) {
        if (menuItem && typeof menuItem === "object" && "key" in menuItem) {
          if (menuItem.key === path) return menuItem.key;
        }
      }
    }
    return prefix === "/student" ? "/student/dashboard" : `${prefix}/dashboard`;
  }, [location.pathname, menuItems, role]);

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    setOpenKeys(parentKeys[selectedKey] || []);
  }, [parentKeys, selectedKey]);

  const onOpenChange: MenuProps["onOpenChange"] = (nextOpenKeys) => {
    const currentOpenKey = nextOpenKeys.find((key) => !openKeys.includes(key));

    if (currentOpenKey === undefined) {
      setOpenKeys(nextOpenKeys);
      return;
    }

    const currentLevel = levelKeys[currentOpenKey];
    setOpenKeys(
      nextOpenKeys.filter(
        (key) => key === currentOpenKey || levelKeys[key] < currentLevel,
      ),
    );
  };

  if (
    (role === "student" || role === "teacher") &&
    isMobile &&
    !mobileVisible
  ) {
    return null;
  }

  return (
    <>
      {isMobile && mobileVisible && (
        <div className="app-sidebar-overlay" onClick={onCloseMobile} />
      )}
      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        className={`app-sidebar ${isMobile ? "app-sidebar-mobile" : ""} ${mobileVisible ? "app-sidebar-open" : ""}`}
        theme="light"
        style={{
          position: isMobile ? "fixed" : "sticky",
          left: isMobile ? (mobileVisible ? 0 : "-250px") : 0,
          top: 0,
          height: "100vh",
          background: "#ffffff",
          zIndex: isMobile ? 1000 : 100,
          transition: "left 0.3s ease",
        }}
      >
        <div className="app-sidebar-logo">
          <div className="app-sidebar-logo-inner">
            <img src={LogoSMK} alt="Logo" className="app-sidebar-logo-img" />
            <span className="app-sidebar-logo-text">E-Presensi SMKCHR</span>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey as string]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          items={menuItems}
          style={{ height: "100%" }}
        />
      </Sider>
    </>
  );
};

export default Sidebar;
