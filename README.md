# 🎓 CampusVoice

## 📌 Overview

CampusVoice คือระบบศูนย์กลางสำหรับแจ้งปัญหาในมหาวิทยาลัย พร้อมระบบโหวตเพื่อจัดลำดับความสำคัญของปัญหา
ช่วยให้ “เสียงของผู้ใช้งาน” ถูกนำไปใช้ในการพัฒนาได้จริง

---

## 🎯 Problem

ปัจจุบันการแจ้งปัญหาในมหาวิทยาลัยมีหลายช่องทาง เช่น OpenChat, Facebook, หรือระบบแจ้งซ่อม
ซึ่งมีข้อจำกัด:

* ข้อมูลกระจัดกระจาย
* ไม่มีการจัดลำดับความสำคัญ
* ไม่สามารถติดตามสถานะได้

---

## 💡 Solution

CampusVoice รวมทุกอย่างไว้ในระบบเดียว:

* แจ้งปัญหา
* โหวต
* จัดอันดับ
* ติดตามสถานะ

---

## 🚀 Features

* 📝 Report Problem (แจ้งปัญหา + รูปภาพ + สถานที่)
* 👍 Vote (โหวตปัญหา)
* 💬 Comment (แสดงความคิดเห็น)
* 📊 Ranking (จัดลำดับปัญหา)
* 🔐 Authentication (Login / Register)
* 👤 Role System (User / Admin / Staff)
* 🔍 Search (ค้นหาปัญหา)

---

## 🏗 System Structure

```
campusvoice/
 ├── frontend/   # React
 ├── backend/    # Node.js API
 ├── public/     # Static files
```

---

## 🛠 Tech Stack

* Frontend: React (Vite)
* Backend: Node.js + Express
* Database: (กำหนดภายหลัง เช่น MongoDB / MySQL)
* Auth: JWT + bcrypt

---

## 🌿 Branch Strategy

* `main` → production
* `develop` → รวมงานหลัก
* `feature/*` → ใช้พัฒนา feature

---

## ⚙️ Getting Started

### 1. Clone repo

```
git clone <repo-url>
cd campusvoice
```

### 2. Frontend

```
cd frontend
npm install
npm run dev
```

### 3. Backend

```
cd backend
npm install
node server.js
```

---

## 📌 Rules

* ห้าม push เข้า main โดยตรง
* ใช้ Pull Request เท่านั้น
* ทุก feature ต้อง merge เข้า develop ก่อน

---

## 📖 Future Improvements

* Dashboard สำหรับ admin
* Notification system
* Mobile application

---

## ✨ Story

CampusVoice ถูกสร้างขึ้นเพื่อให้ปัญหาเล็ก ๆ ของนักศึกษา
กลายเป็น “เสียงที่มีพลัง” และถูกนำไปแก้ไขจริง
