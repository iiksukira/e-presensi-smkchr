/** @format */

import React from "react";
import LoginPage from "../LoginPage";

const TeacherLoginPage: React.FC = () => (
  <LoginPage
    title="Portal Guru"
    subtitle="Dashboard Guru"
    loginLabel="Login Guru"
    redirectPath="/teacher/dashboard"
    acceptedRoles={["guru"]}
    featureOne="Portal Guru"
    featureTwo="Manajemen Kelas"
    persistToLocalStorage
    redirectDelay={500}
  />
);

export default TeacherLoginPage;
