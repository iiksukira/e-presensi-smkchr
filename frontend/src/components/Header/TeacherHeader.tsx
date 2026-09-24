/** @format */

import React from "react";
import Header from "./Header";

interface TeacherHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = (props) => (
  <Header
    {...props}
    defaultName="Guru"
    defaultRole="Guru"
    loginPath="/teacher/login"
    settingsPath="/teacher/settings"
    notificationPath="/teacher/notifications"
    notificationCount={8}
  />
);

export default TeacherHeader;
