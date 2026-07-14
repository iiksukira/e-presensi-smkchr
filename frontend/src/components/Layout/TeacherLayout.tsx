/** @format */

import React, { useState, useEffect } from "react";
import { Layout, theme, Grid } from "antd";
import { Outlet } from "react-router-dom";
import TeacherSidebar from "../Layout/TeacherSidebar";
import TeacherHeader from "./TeacherHeader";

const { Content } = Layout;
const { useToken } = theme;
const { useBreakpoint } = Grid;

const TeacherLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const { token } = useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
      setMobileVisible(false);
    } else {
      setCollapsed(false);
      setMobileVisible(false);
    }
  }, [isMobile]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileVisible((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <TeacherSidebar
        collapsed={isMobile ? false : collapsed}
        mobileVisible={mobileVisible}
        onCollapse={setCollapsed}
        onCloseMobile={() => setMobileVisible(false)}
      />
      <Layout>
        <TeacherHeader
          collapsed={collapsed}
          mobileVisible={mobileVisible}
          onToggleSidebar={handleToggleSidebar}
        />
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 280,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            overflow: "initial",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;
