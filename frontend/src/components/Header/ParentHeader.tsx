/** @format */

import React from "react";
import Header from "./Header";

interface ParentHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

const ParentHeader: React.FC<ParentHeaderProps> = (props) => (
  <Header
    {...props}
    defaultName="Orang Tua"
    defaultRole="Orang Tua"
    loginPath="/parent/login"
    settingsPath="/parent/settings"
    notificationPath="/parent/notifications"
    includeChildMenu
  />
);

export default ParentHeader;
