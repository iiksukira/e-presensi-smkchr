/** @format */

import React from "react";
import Header from "./Header";

interface StudentHeaderProps {
  collapsed?: boolean;
  mobileVisible?: boolean;
  onToggleSidebar?: () => void;
}

const StudentHeader: React.FC<StudentHeaderProps> = (props) => (
  <Header
    {...props}
    defaultName="Siswa"
    defaultRole="Siswa"
    loginPath="/student/login"
    profilePath="/student/profile"
    settingsPath="/student/settings"
    notificationPath="/student/notifications"
  />
);

export default StudentHeader;
