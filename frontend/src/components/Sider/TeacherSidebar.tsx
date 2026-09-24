/** @format */

import React from "react";
import Sidebar from "./Sidebar";

interface TeacherSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = (props) => (
  <Sidebar {...props} role="teacher" />
);

export default TeacherSidebar;
