/** @format */

import React from "react";
import Sidebar from "./Sidebar";

interface AdminSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = (props) => (
  <Sidebar {...props} role="admin" />
);

export default AdminSidebar;
