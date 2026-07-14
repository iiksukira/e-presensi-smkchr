/** @format */

import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Layout, ConfigProvider } from "antd";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";

const { Content } = Layout;

const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
  const location = useLocation();

  const isLoginPage =
    location.pathname.includes("/login") || location.pathname.includes("/auth");

  if (isLoginPage) {
    return (
      <ConfigProvider>
        <Outlet />
      </ConfigProvider>
    );
  }

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarVisible(!mobileSidebarVisible);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarVisible(false);
    }
  };

  return (
    <ConfigProvider>
      <Layout className="admin-layout">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          mobileVisible={mobileSidebarVisible}
          onCollapse={setSidebarCollapsed}
          onCloseMobile={closeMobileSidebar}
        />
        <Layout className="admin-layout-body">
          <AdminHeader
            collapsed={sidebarCollapsed}
            mobileVisible={mobileSidebarVisible}
            onToggleSidebar={toggleSidebar}
          />
          <Content
            className="admin-layout-content"
            onClick={closeMobileSidebar}
          >
            <div className="admin-layout-content-wrapper">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminLayout;
