/** @format */

import React from "react";
import Sidebar from "./Sidebar";

interface StudentSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = (props) => (
  <Sidebar {...props} role="student" />
);

export default StudentSidebar;
