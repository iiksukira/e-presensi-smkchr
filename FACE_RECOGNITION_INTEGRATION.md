<!-- @format -->

# Integrasi Face Recognition - ABSENSI-SMKCHR

## Overview

Aplikasi absensi SMK ini telah terintegrasi dengan face recognition menggunakan face-api.js untuk autentikasi biometrik wajah.

## Model Files

Model-model face recognition disimpan di `frontend/public/models/`:

- `tiny_face_detector_model-shard1` & `tiny_face_detector_model-weights_manifest.json`
- `face_landmark_68_model-shard1` & `face_landmark_68_model-weights_manifest.json`
- `face_recognition_model-shard1`, `face_recognition_model-shard2` & `face_recognition_model-weights_manifest.json`

## Implementasi

### 1. Loading Models

Model dimuat secara otomatis saat komponen mount di:

- `SelfAttendance.tsx` (untuk absensi guru)
- `RegisterFace.tsx` (untuk registrasi wajah guru)

```typescript
const MODEL_URL = "/models";
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
]);
```

### 2. Face Detection & Recognition

- **Detection**: Menggunakan TinyFaceDetector untuk mendeteksi wajah
- **Landmarks**: Menggunakan FaceLandmark68Net untuk landmark wajah
- **Recognition**: Menggunakan FaceRecognitionNet untuk menghasilkan descriptor wajah

### 3. Backend Processing

- Face descriptor dikirim ke backend sebagai array angka
- Backend menghitung Euclidean distance antara descriptor baru dan tersimpan
- Threshold distance: 0.45 (semakin kecil semakin akurat)

### 4. Database Storage

- Face data disimpan sebagai JSON string di kolom `face_data`
- Tabel yang terpengaruh: `teachers`, `students`

## Cara Penggunaan

### Registrasi Wajah Guru:

1. Akses halaman Register Face
2. Izinkan akses kamera
3. Lakukan 3 kali capture wajah dari sudut berbeda
4. Sistem akan menyimpan rata-rata descriptor

### Absensi:

1. Akses halaman Self Attendance
2. Sistem akan memverifikasi wajah dengan data terdaftar
3. Jika cocok, absensi akan tercatat dengan lokasi GPS

## Troubleshooting

### Model Loading Error:

- Pastikan file model lengkap di `public/models/`
- Periksa koneksi internet saat pertama kali load
- Error handling sudah ditambahkan untuk memberikan feedback

### Face Detection Gagal:

- Pastikan pencahayaan cukup
- Posisikan wajah di tengah frame kamera
- Hindari gerakan berlebihan saat capture

### Face Recognition Tidak Cocok:

- Lakukan registrasi ulang jika wajah berubah signifikan
- Pastikan kondisi pencahayaan sama dengan saat registrasi
- Threshold distance dapat disesuaikan di backend jika perlu

## Dependencies

- `face-api.js`: ^0.22.2
- Model files dari face-api.js repository

## Security Notes

- Face data disimpan terenkripsi di database
- Verifikasi dilakukan di sisi server
- GPS location tracking untuk keamanan tambahan</content>
  <parameter name="filePath">d:\JANGAN DI KLIK BAHAYA\WEB DEV\ABSENSI-SMKCHR\FACE_RECOGNITION_INTEGRATION.md
