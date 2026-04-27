# 🎓 CampusVoice
> ระบบสำรวจปัญหาและโหวตพัฒนาพื้นที่ในมหาวิทยาลัย

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](.)
[![Course](https://img.shields.io/badge/course-คพ.363-blue)](.)
[![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS%20%7C%20React%20%7C%20Node-informational)](.)

---

## 📌 เกี่ยวกับโปรเจกต์

**CampusVoice** คือศูนย์กลางในการรวบรวมปัญหาและจัดลำดับความสำคัญด้วยเสียงของผู้ใช้งานในมหาวิทยาลัย ไม่ว่าจะเป็นปัญหาแอร์ไม่เย็น Wi-Fi หลุด ห้องน้ำไม่สะอาด หรืออาหารในโรงอาหาร นักศึกษาและบุคลากรสามารถแจ้งปัญหา โหวต และติดตามสถานะการแก้ไขได้ในระบบเดียว

---

## ✨ ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| 📝 แจ้งปัญหา | แจ้งพร้อมรายละเอียด รูปภาพ และสถานที่ |
| 📋 รายการปัญหา | ดูปัญหาทั้งหมด กรองตามหมวดหมู่/สถานะ เรียงตามโหวต |
| 👍 ระบบโหวต | Upvote ปัญหาที่ต้องการให้แก้ไข |
| 💬 ความคิดเห็น | แสดงความคิดเห็นใต้แต่ละปัญหา |
| 🔍 ค้นหา | ค้นหาหัวข้อปัญหาหรือสถานที่ |
| 📊 Dashboard | สถิติและกราฟสรุปภาพรวมปัญหา |
| 🔐 ระบบผู้ใช้ | Login / Logout พร้อม Role (Admin, Staff, User) |
| 🛠️ Admin Panel | เปลี่ยนสถานะปัญหา (รอดำเนินการ / กำลังแก้ไข / เสร็จสิ้น) |

---

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3 (Responsive Web Design)
- JavaScript (ES6+)
- React.js

### Backend
- Node.js
- Express.js
- JWT Authentication + bcrypt

### Tools
- Git & GitHub
- Web Hosting (Deploy)

---

## 👥 ทีมพัฒนา

| คน | ชื่อ | รับผิดชอบ |
|----|------|-----------|
| 1 | (ชื่อ) | Project Lead + ระบบ Authentication |
| 2 | (ชื่อ) | ระบบแจ้งปัญหา + อัปโหลดรูปภาพ |
| 3 | (ชื่อ) | รายการปัญหา + Filter/Sort |
| 4 | (ชื่อ) | ระบบโหวต + ความคิดเห็น |
| 5 | (ชื่อ) | ระบบค้นหา + Dashboard สถิติ |
| 6 | (ชื่อ) | Admin Panel + Web Hosting |

---

## 📁 โครงสร้างโปรเจกต์

```
campusvoice/
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── variables.css
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── axios.js
│       ├── context/
│       │   └── AuthContext.jsx       ← useAuth() hook อยู่ที่นี่
│       └── components/
│           ├── auth/                 ← Feature 1 (มิว)
│           ├── issues/               ← Feature 2 (แฮม), 3 (ครีม)
│           ├── votes/                ← Feature 4 (หนุ่ม)
│           ├── comments/             ← Feature 4 (หนุ่ม)
│           ├── admin/                ← Feature 5 (ไผ่), 6 (mark)
│           └── shared/               ← ใช้ร่วมกัน
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
    │   └── admin.js                  ← รวม stats endpoint ไว้ที่นี่
    ├── middleware/
    │   ├── verifyToken.js
    │   └── roleGuard.js
    ├── models/
    │   └── schema.sql                ← MySQL schema (4 tables)
    └── uploads/                      ← รูปภาพที่ upload (gitignored)
```

---

## 🚀 วิธีรันโปรเจกต์

### 1. Clone repository
```bash
git clone https://github.com/<your-org>/campusvoice.git
cd campusvoice
```

### 2. รัน Backend
```bash
cd backend
npm install
cp .env.example .env   # แก้ไขค่า DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
mysql -u root -p < models/schema.sql
npm run dev
```

### 3. รัน Frontend
```bash
cd frontend
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173`

---

## 🌐 API Endpoints

| Method | Endpoint | คำอธิบาย | Role |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | สมัครสมาชิก | Public |
| POST | `/api/auth/login` | เข้าสู่ระบบ | Public |
| GET | `/api/auth/me` | ข้อมูล user ปัจจุบัน | User |
| GET | `/api/issues` | ดูรายการปัญหาทั้งหมด | Public |
| POST | `/api/issues` | แจ้งปัญหาใหม่ | User |
| GET | `/api/issues/:id` | ดูรายละเอียดปัญหา | Public |
| GET | `/api/issues/search?q=` | ค้นหาปัญหา | Public |
| PATCH | `/api/issues/:id/status` | เปลี่ยนสถานะปัญหา | Admin/Staff |
| POST | `/api/votes/:issueId` | โหวตปัญหา | User |
| DELETE | `/api/votes/:issueId` | ยกเลิกโหวต | User |
| GET | `/api/comments/:issueId` | ดูความคิดเห็น | Public |
| POST | `/api/comments/:issueId` | แสดงความคิดเห็น | User |
| DELETE | `/api/comments/:id` | ลบความคิดเห็น | User/Admin |
| GET | `/api/admin/stats` | ดูสถิติสรุป | Admin/Staff |
| GET | `/api/admin/users` | จัดการผู้ใช้ | Admin |
| PATCH | `/api/admin/users/:id/role` | เปลี่ยน role ผู้ใช้ | Admin |

---

## 🔀 Branch Strategy

```
main          → production-ready code
develop       → รวม feature ก่อน merge ขึ้น main
feature/auth           → คน 1
feature/report-issue   → คน 2
feature/issue-list     → คน 3
feature/vote-comment   → คน 4
feature/search-dashboard → คน 5
feature/admin          → คน 6
```

### Git Workflow
```bash
# เริ่มงานใหม่
git checkout develop
git pull origin develop
git checkout -b feature/your-feature

# เมื่อเสร็จแล้ว
git add .
git commit -m "feat: your message"
git push origin feature/your-feature
# → เปิด Pull Request → คน 1 review → merge ลง develop
```

---

## 📊 เปรียบเทียบกับระบบที่มีอยู่

| ระบบ | แจ้งปัญหา | โหวต | จัดลำดับ | ติดตามสถานะ |
|------|-----------|------|----------|-------------|
| OpenChat TU | ✅ | ❌ | ❌ | ❌ |
| เพจ อมธ. | ✅ | ❌ | ❌ | ❌ |
| BaanTU | ✅ | ❌ | ❌ | ✅ |
| **CampusVoice** | ✅ | ✅ | ✅ | ✅ |

---

## 📝 License

โปรเจกต์นี้เป็นส่วนหนึ่งของรายวิชา **คพ.363** ภาควิชาวิทยาการคอมพิวเตอร์
ผู้สอน: ผศ.ดร.ฐาปนา บุญชู
