/** @format */

import React from "react";
import Sidebar from "./Sidebar";

interface ParentSidebarProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

const ParentSidebar: React.FC<ParentSidebarProps> = (props) => (
  <Sidebar {...props} role="parent" />
);

export default ParentSidebar;
