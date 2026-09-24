/** @format */

import React from "react";
import LoginPage from "../LoginPage";

const StudentLoginPage: React.FC = () => (
  <LoginPage
    title="Portal Siswa"
    subtitle="Dashboard Siswa"
    loginLabel="Login Siswa"
    redirectPath="/student/dashboard"
    acceptedRoles={["siswa"]}
    featureOne="Portal Siswa"
    featureTwo="Presensi Online"
  />
);

export default StudentLoginPage;
