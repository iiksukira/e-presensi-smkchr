/** @format */

import React from "react";
import LoginPage from "../LoginPage";

const ParentLoginPage: React.FC = () => (
  <LoginPage
    title="Portal Orang Tua"
    subtitle="Monitoring Siswa"
    loginLabel="Login Orang Tua"
    redirectPath="/parent"
    acceptedRoles={["ortu", "orangtua"]}
    featureOne="Monitoring Siswa"
    featureTwo="Laporan Presensi"
  />
);

export default ParentLoginPage;
