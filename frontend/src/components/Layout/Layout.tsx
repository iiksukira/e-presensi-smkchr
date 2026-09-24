/** @format */

import React, { useEffect, useState } from "react";
import { ConfigProvider, Grid, Layout as AntLayout, theme } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import AdminHeader from "../Header/AdminHeader";
import ParentHeader from "../Header/ParentHeader";
import StudentHeader from "../Header/StudentHeader";
import TeacherHeader from "../Header/TeacherHeader";
import AdminSidebar from "../Sider/AdminSidebar";
import ParentSidebar from "../Sider/ParentSidebar";
import StudentSidebar from "../Sider/StudentSidebar";
import TeacherSidebar from "../Sider/TeacherSidebar";
import "./Layout.css";

const { Content } = AntLayout;
const { useBreakpoint } = Grid;

export type LayoutRole = "admin" | "teacher" | "student" | "parent";

interface LayoutProps {
  role: LayoutRole;
}

const roleComponents = {
  admin: { Header: AdminHeader, Sidebar: AdminSidebar },
  teacher: { Header: TeacherHeader, Sidebar: TeacherSidebar },
  student: { Header: StudentHeader, Sidebar: StudentSidebar },
  parent: { Header: ParentHeader, Sidebar: ParentSidebar },
} as const;

const Layout: React.FC<LayoutProps> = ({ role }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();
  const { Header, Sidebar } = roleComponents[role];

  useEffect(() => {
    if (role === "admin") return;

    if (isMobile) {
      setCollapsed(true);
      setMobileVisible(false);
    } else {
      setCollapsed(false);
      setMobileVisible(false);
    }
  }, [isMobile, role]);

  if (
    role === "admin" &&
    (location.pathname.includes("/login") ||
      location.pathname.includes("/auth"))
  ) {
    return (
      <ConfigProvider>
        <Outlet />
      </ConfigProvider>
    );
  }

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileVisible((previous) => !previous);
    } else {
      setCollapsed((previous) => !previous);
    }
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileVisible(false);
    }
  };

  return (
    <ConfigProvider>
      <AntLayout className="app-layout">
        <Sidebar
          collapsed={isMobile && role !== "admin" ? false : collapsed}
          mobileVisible={mobileVisible}
          onCollapse={setCollapsed}
          onCloseMobile={closeMobileSidebar}
        />
        <AntLayout className="app-layout-body">
          <Header
            collapsed={collapsed}
            mobileVisible={mobileVisible}
            onToggleSidebar={toggleSidebar}
          />
          <Content
            className="app-layout-content"
            onClick={closeMobileSidebar}
            style={{
              backgroundColor:
                role === "admin" ? "#f5f5f5" : token.colorBgContainer,
            }}
          >
            <div className="app-layout-content-wrapper">
              <Outlet />
            </div>
          </Content>
        </AntLayout>
      </AntLayout>
    </ConfigProvider>
  );
};

export default Layout;
