/** @format */

import React from "react";
import LoginPage from "../LoginPage";

const AdminLoginPage: React.FC = () => (
  <LoginPage
    title="Admin Panel"
    subtitle="Dashboard Administrator"
    loginLabel="Login Administrator"
    redirectPath="/admin"
    acceptedRoles={["admin"]}
    featureOne="Verifikasi Wajah"
    featureTwo="Presensi Real-time"
    pageTitle="Login Admin"
  />
);

export default AdminLoginPage;
