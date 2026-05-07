import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './ReportIssuePage.css';

const CATEGORIES = ['ห้องเรียน', 'ห้องน้ำ', 'อาหาร', 'Wi-Fi', 'ความปลอดภัย', 'อื่นๆ'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TITLE_MAX = 100;
const DESC_MAX = 500;
const LOCATION_MAX = 200;

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearImageState() {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFile(file) {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('รับเฉพาะไฟล์ PNG, JPG, WEBP เท่านั้น');
      clearImageState();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
      clearImageState();
      return;
    }
    setError(null);
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleFileInput(e) {
    handleFile(e.target.files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function removeImage() {
    clearImageState();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('กรุณากรอกหัวข้อปัญหา');
      return;
    }
    if (!form.description.trim()) {
      setError('กรุณากรอกรายละเอียดปัญหา');
      return;
    }

    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('description', form.description.trim());
    if (form.category) data.append('category', form.category);
    if (form.location.trim()) data.append('location', form.location.trim());
    if (image) data.append('image', image);

    setIsSubmitting(true);
    try {
      await api.post('/issues', data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="report-page">
        <div className="report-card">
          <h1 className="report-title">ส่งเรื่องสำเร็จ</h1>
          <p className="success-message">ปัญหาของคุณถูกบันทึกแล้ว ทีมงานจะดำเนินการโดยเร็วที่สุด</p>
          <div className="form-actions">
            <button className="btn-submit" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-card">
        <h1 className="report-title">แจ้งปัญหา</h1>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">หัวข้อปัญหา <span className="required">*</span></label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              maxLength={TITLE_MAX}
              placeholder="สรุปปัญหาสั้นๆ"
              className="form-input"
            />
            <span className={`char-counter ${form.title.length >= TITLE_MAX ? 'counter-limit' : ''}`}>
              {form.title.length}/{TITLE_MAX}
            </span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">รายละเอียด <span className="required">*</span></label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={DESC_MAX}
              rows={5}
              placeholder="อธิบายปัญหาให้ชัดเจน เกิดขึ้นที่ไหน เมื่อไหร่ ..."
              className="form-input"
            />
            <span className={`char-counter ${form.description.length >= DESC_MAX ? 'counter-limit' : ''}`}>
              {form.description.length}/{DESC_MAX}
            </span>
          </div>

          {/* Category + Location row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">หมวดหมู่</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">สถานที่</label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                maxLength={LOCATION_MAX}
                placeholder="เช่น ตึก A ชั้น 3"
                className="form-input"
              />
            </div>
          </div>

          {/* Image Upload Zone */}
          <div className="form-group">
            <label>รูปภาพประกอบ</label>
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="preview" className="image-preview" />
                <div className="image-info">
                  <span className="image-name">{image?.name}</span>
                  <button type="button" className="btn-remove-image" onClick={removeImage}>
                    ลบรูป
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <span className="upload-icon">📷</span>
                <p>ลากรูปมาวางที่นี่ หรือ <span className="upload-link">คลิกเพื่อเลือกไฟล์</span></p>
                <p className="upload-hint">PNG, JPG, WEBP ขนาดไม่เกิน 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="file-input-hidden"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/issues')}
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังส่ง...' : 'แจ้งปัญหา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
