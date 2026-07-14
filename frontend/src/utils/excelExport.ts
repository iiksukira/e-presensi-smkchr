/** @format */

import * as XLSX from "xlsx";

interface ReportData {
  id: number;
  date: string;
  full_name: string;
  role: string;
  class_name: string;
  time_in: string;
  time_out: string;
  location_lat: number;
  location_lng: number;
  status: string;
}

export const exportAttendanceToExcel = (
  data: ReportData[],
  filters: {
    date?: string | null;
    role?: string | null;
    className?: string | null;
    classId?: string | null;
  },
) => {
  if (data.length === 0) {
    return;
  }

  const transformedData = data.map((item) => ({
    Tanggal: new Date(item.date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    "Nama Lengkap": item.full_name,
    Role: item.role.toUpperCase(),
    Kelas: item.class_name || "-",
    "Jam Masuk": item.time_in,
    "Jam Keluar":
      item.time_out && item.time_out !== "null" ? item.time_out : "Belum",
    Status: item.status || "-",
    Latitude: item.location_lat,
    Longitude: item.location_lng,
  }));

  const ws = XLSX.utils.json_to_sheet(transformedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Presensi");

  const columnWidths = [
    { wch: 15 },
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
  ];
  ws["!cols"] = columnWidths;

  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  let filename = "Laporan_Presensi";
  if (filters.date) {
    filename += `_${filters.date}`;
  }
  if (filters.role) {
    filename += `_${filters.role}`;
  }
  if (filters.className) {
    filename += `_${filters.className.replace(/\s+/g, "_")}`;
  } else if (filters.classId) {
    filename += `_${filters.classId}`;
  }
  filename += `_${new Date().toISOString().split("T")[0]}`;
  filename += ".xlsx";

  XLSX.writeFile(wb, filename);
};
