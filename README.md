# CampusVoice

ระบบแจ้งปัญหาออนไลน์สำหรับนักศึกษาและบุคลากรในมหาวิทยาลัย — แจ้งปัญหา โหวต ติดตามสถานะ และจัดการโดยเจ้าหน้าที่ได้ในระบบเดียว

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](.)
[![Course](https://img.shields.io/badge/course-คพ.363-blue)](.)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20MongoDB-informational)](.)

---

## ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| แจ้งปัญหา | แจ้งพร้อมรายละเอียด รูปภาพ หมวดหมู่ และสถานที่ |
| รายการปัญหา | ดูปัญหาทั้งหมด กรองตามหมวดหมู่/สถานะ เรียงตามวันที่หรือโหวต |
| ระบบโหวต | Upvote/Unvote ปัญหา (toggle) |
| ความคิดเห็น | แสดงและลบความคิดเห็นใต้แต่ละปัญหา |
| ค้นหา | ค้นหาชื่อ คำอธิบาย หมวดหมู่ และสถานที่ |
| Dashboard | สถิติ กราฟ และค้นหาปัญหาสำหรับ Admin/Staff |
| Admin Panel | เปลี่ยนสถานะปัญหาและจัดการ role ผู้ใช้ |
| ระบบผู้ใช้ | Register / Login / Logout พร้อม role (user, staff, admin) |

---

## Tech Stack

**Frontend:** React 18 + Vite, React Router v6, Axios

**Backend:** Node.js, Express.js, Mongoose (MongoDB), JWT + bcrypt, Multer

**Database:** MongoDB

---

## โครงสร้างโปรเจกต์

```
campusvoice/
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── variables.css          ← CSS design tokens
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── axios.js       ← Axios instance (baseURL: /api)
│       ├── context/
│       │   └── AuthContext.jsx
│       └── components/
│           ├── auth/          ← LoginPage, RegisterPage
│           ├── issues/        ← IssueListPage, IssueDetailPage, ReportIssuePage
│           ├── votes/         ← VoteButton
│           ├── comments/      ← CommentList
│           ├── admin/         ← DashboardPage, AdminPage
│           └── common/        ← SideNav, Pagination
│
└── backend/
    ├── server.js
    ├── db.js
    ├── .env.example
    ├── routes/
    │   ├── auth.js
    │   ├── issues.js
    │   ├── votes.js
    │   ├── comments.js
    │   └── admin.js
    ├── middleware/
    │   ├── verifyToken.js
    │   ├── roleGuard.js
    │   └── upload.js          ← Multer config
    ├── models/
    │   ├── User.js
    │   ├── Issue.js
    │   ├── Vote.js
    │   └── Comment.js
    ├── lib/
    │   └── issueHelpers.js    ← formatIssues, buildFilter, getPagination
    ├── repositories/
    │   └── authRepository.js
    ├── services/
    │   └── authService.js
    ├── scripts/
    │   └── seedAdmin.js       ← สร้าง admin user ครั้งแรก
    └── uploads/               ← รูปภาพที่ upload (gitignored)
```

---

## การติดตั้งและรัน

### ความต้องการเบื้องต้น

- Node.js 18+
- MongoDB (local หรือ MongoDB Atlas)

### 1. Clone repository

```bash
git clone https://github.com/Kittithatdensakulprasert/campusvoice.git
cd campusvoice
```

### 2. ตั้งค่า Backend

```bash
cd backend
npm install
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/campusvoice
JWT_SECRET=เปลี่ยนเป็น_random_string_ยาวๆ
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173

# สำหรับสร้าง admin user ครั้งแรก
ADMIN_EMAIL=admin@campusvoice.ac.th
ADMIN_PASSWORD=ใส่รหัสผ่านที่ต้องการ
ADMIN_NAME=Admin
```

รัน backend:

```bash
npm run dev
```

Backend จะรันที่ `http://localhost:5001`

### 3. ตั้งค่า Frontend

```bash
cd ../frontend
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173`

### 4. สร้าง Admin User (ครั้งแรก)

```bash
cd backend
npm run seed:admin
```

คำสั่งนี้จะสร้างหรืออัปเดต user ตาม `ADMIN_EMAIL` / `ADMIN_PASSWORD` ใน `.env` ให้มี role เป็น `admin`

---

## API Endpoints

### Auth

| Method | Endpoint | คำอธิบาย | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | สมัครสมาชิก | Public |
| POST | `/api/auth/login` | เข้าสู่ระบบ | Public |
| GET | `/api/auth/me` | ดูข้อมูล user ปัจจุบัน | User |

### Issues

| Method | Endpoint | คำอธิบาย | Auth |
|--------|----------|-----------|------|
| GET | `/api/issues` | ดูรายการปัญหาทั้งหมด | Public |
| GET | `/api/issues/search?q=&category=&status=` | ค้นหาปัญหา | Public |
| GET | `/api/issues/:id` | ดูรายละเอียดปัญหา | Public |
| POST | `/api/issues` | แจ้งปัญหาใหม่ (รองรับ multipart/form-data) | User |
| PATCH | `/api/issues/:id/status` | เปลี่ยนสถานะปัญหา | Admin/Staff |
| DELETE | `/api/issues/:id` | ลบปัญหา | Admin |

### Votes

| Method | Endpoint | คำอธิบาย | Auth |
|--------|----------|-----------|------|
| POST | `/api/votes/:issueId` | Toggle โหวต (โหวต/ยกเลิกโหวต) | User |

### Comments

| Method | Endpoint | คำอธิบาย | Auth |
|--------|----------|-----------|------|
| GET | `/api/comments/:issueId` | ดูความคิดเห็น | Public |
| POST | `/api/comments/:issueId` | แสดงความคิดเห็น | User |
| DELETE | `/api/comments/:id` | ลบความคิดเห็น | เจ้าของ/Admin |

### Admin

| Method | Endpoint | คำอธิบาย | Auth |
|--------|----------|-----------|------|
| GET | `/api/admin/stats` | สถิติสรุปภาพรวม | Admin/Staff |
| GET | `/api/admin/users` | รายชื่อผู้ใช้ทั้งหมด | Admin |
| PATCH | `/api/admin/users/:id/role` | เปลี่ยน role ผู้ใช้ | Admin |

---

## Role และสิทธิ์การใช้งาน

| Role | สิทธิ์ |
|------|--------|
| `user` | แจ้งปัญหา, โหวต, คอมเมนต์ |
| `staff` | ทุกอย่างของ user + เปลี่ยนสถานะปัญหา + ดู dashboard |
| `admin` | ทุกอย่างของ staff + จัดการ role ผู้ใช้ + ลบปัญหา |

---

## สถานะปัญหา

| Status | ความหมาย |
|--------|----------|
| `open` | รอดำเนินการ — ปัญหาถูกแจ้งแล้ว ยังไม่มีใครรับงาน |
| `in_progress` | กำลังดำเนินการ — staff รับงานแล้ว กำลังแก้ไข |
| `resolved` | แก้ไขแล้ว — ดำเนินการเสร็จ รอการยืนยัน |
| `closed` | ปิดงาน — จบกระบวนการทั้งหมด |

---

## Branch Strategy

```
main      → production-ready
develop   → รวม feature ก่อน merge ขึ้น main
feature/* → งานแต่ละฟีเจอร์
```

```bash
# เริ่มงานใหม่
git checkout develop
git pull origin develop
git checkout -b feature/your-feature

# เมื่อเสร็จแล้ว
git add .
git commit -m "feat: your message"
git push origin feature/your-feature
# เปิด Pull Request → review → merge ลง develop
```

---

## ทีมพัฒนา

| คน | ชื่อ | รับผิดชอบ |
|----|------|-----------|
| 1 | กิตติธัช เด่นสกุลประเสริฐ | Project Lead + ระบบ Authentication |
| 2 | พชร พรพงศ์ | ระบบแจ้งปัญหา + อัปโหลดรูปภาพ |
| 3 | พิรญาณ์ เอนอ่อน | รายการปัญหา + Filter/Sort + Pagination |
| 4 | กิตติภณ คำนวล | ระบบโหวต + ความคิดเห็น |
| 5 | ณัฏฐ์ ศรีสุวรรณกุล | ระบบค้นหา + Dashboard สถิติ |
| 6 | ธนกฤต พิบูลย์สวัสดิ์ | Admin Panel + Deployment |

---

โปรเจกต์นี้เป็นส่วนหนึ่งของรายวิชา **คพ.363** ภาควิชาวิทยาการคอมพิวเตอร์ ผศ.ดร.ฐาปนา บุญชู
