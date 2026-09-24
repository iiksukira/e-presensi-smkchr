/** @format */

import React from "react";
import Header from "./Header";

interface AdminHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = (props) => (
  <Header
    {...props}
    defaultName="User"
    defaultRole="User"
    loginPath="/admin/login"
    settingsPath="/admin/settings"
  />
);

export default AdminHeader;
