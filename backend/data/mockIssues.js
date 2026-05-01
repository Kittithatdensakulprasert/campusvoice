const mockIssues = [
  {
    id: 1,
    title: 'โปรเจคเตอร์ห้องเรียนใช้งานไม่ได้',
    description: 'โปรเจคเตอร์ในห้อง CS-301 เปิดติดแต่ไม่แสดงภาพ ทำให้อาจารย์สอนไม่สะดวก',
    category: 'ห้องเรียน',
    location: 'อาคารวิทยาการคอมพิวเตอร์ ห้อง CS-301',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    votes: 12,
    author_name: 'Mew',
    created_at: '2026-04-20',
    updated_at: '2026-04-20'
  },
  {
    id: 2,
    title: 'Wi-Fi ชั้น 2 หลุดบ่อย',
    description: 'สัญญาณ Wi-Fi บริเวณห้องอ่านหนังสือชั้น 2 หลุดทุก 5-10 นาที โดยเฉพาะช่วงเย็น',
    category: 'Wi-Fi',
    location: 'ห้องอ่านหนังสือ ชั้น 2',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    status: 'in_progress',
    votes: 8,
    author_name: 'Ham',
    created_at: '2026-04-22',
    updated_at: '2026-04-23'
  },
  {
    id: 3,
    title: 'ห้องน้ำชั้น 1 น้ำไม่ไหล',
    description: 'อ่างล้างมือในห้องน้ำหญิงชั้น 1 น้ำไม่ไหลหลายจุด และไม่มีป้ายแจ้งเตือน',
    category: 'ห้องน้ำ',
    location: 'อาคารเรียนรวม ชั้น 1',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    status: 'closed',
    votes: 20,
    author_name: 'Mark',
    created_at: '2026-04-18',
    updated_at: '2026-04-19'
  },
  {
    id: 4,
    title: 'อาหารโรงอาหารหมดเร็ว',
    description: 'ช่วงพักกลางวันร้านอาหารหลายร้านหมดก่อน 12:30 ทำให้นักศึกษาที่เลิกเรียนช้าไม่มีตัวเลือก',
    category: 'อาหาร',
    location: 'โรงอาหารกลาง',
    image_url: '',
    status: 'resolved',
    votes: 15,
    author_name: 'Prae',
    created_at: '2026-04-24',
    updated_at: '2026-04-25'
  },
  {
    id: 5,
    title: 'ทางเดินหลังตึกมืดมาก',
    description: 'ไฟทางเดินหลังตึกกิจกรรมไม่สว่างพอในช่วงกลางคืน เสี่ยงต่อความปลอดภัย',
    category: 'ความปลอดภัย',
    location: 'หลังตึกกิจกรรมนักศึกษา',
    image_url: '',
    status: 'open',
    votes: 17,
    author_name: 'Nine',
    created_at: '2026-04-26',
    updated_at: '2026-04-26'
  }
];

module.exports = mockIssues;
