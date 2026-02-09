'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Phone,
    GraduationCap,
    Calendar,
    QrCode,
    X,
    Edit2,
    Trash2,
    Save,
    CheckCircle2,
    AlertCircle,
    School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react'; // SVG 대신 Canvas 사용
import { supabase } from '@/lib/supabase';

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [showToast, setShowToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        school: '',
        grade: '',
        birthDate: '',
        parentContact: '',
        classId: '',
        qrData: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        const [studentRes, classRes] = await Promise.all([
            supabase.from('students').select('*, classes(name)').order('name'),
            supabase.from('classes').select('id, name')
        ]);

        if (studentRes.error) console.error('Error fetching students:', studentRes.error);
        setStudents(studentRes.data || []);
        setClasses(classRes.data || []);
        setLoading(false);
    };

    const triggerToast = (message, type = 'success') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    const handleOpenAddModal = () => {
        setEditingStudent(null);
        setFormData({ name: '', school: '', grade: '', birthDate: '', parentContact: '', classId: '', qrData: `ST-${Date.now()}` });
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            school: student.school || '',
            grade: student.grade || '',
            birthDate: student.birth_date || '',
            parentContact: student.parent_contact || '',
            classId: student.class_id || '',
            qrData: student.qr_code_data || `ST-${Date.now()}`
        });
        setIsAddModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            school: formData.school,
            grade: formData.grade,
            birth_date: formData.birthDate || null,
            parent_contact: formData.parentContact,
            class_id: formData.classId || null,
            qr_code_data: formData.qrData
        };

        if (editingStudent) {
            const { error } = await supabase.from('students').update(payload).eq('id', editingStudent.id);
            if (error) triggerToast('수정 중 오류가 발생했습니다.', 'error');
            else { fetchInitialData(); triggerToast('정보가 수정되었습니다.'); }
        } else {
            const { error } = await supabase.from('students').insert([payload]);
            if (error) triggerToast('등록 중 오류가 발생했습니다.', 'error');
            else { fetchInitialData(); triggerToast('신규 학생이 등록되었습니다.'); }
        }
        setIsAddModalOpen(false);
    };

    const handleDelete = async (id, name) => {
        if (confirm(`'${name}' 학생 정보를 삭제하시겠습니까?`)) {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (!error) {
                setStudents(students.filter(s => s.id !== id));
                triggerToast('학생 정보가 삭제되었습니다.', 'error');
            }
        }
    };

    const downloadQR = () => {
        const canvas = document.getElementById('student-qr-canvas');
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            let downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${selectedStudent.name}_QR코드.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            triggerToast('이미지가 다운로드되었습니다.');
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.school?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header className="page-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div style={{ flex: '1', minWidth: '240px' }}>
                    <h1 style={{ marginBottom: '8px' }}>학생 관리</h1>
                    <p>학생 학적 정보와 QR 코드를 통합 관리합니다.</p>
                </div>
                <button className="btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
                    <Plus size={20} /> <span className="hide-mobile">신규 학생 등록</span><span className="show-mobile">학생 등록</span>
                </button>
            </header>

            {/* Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>전체 학생</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>{students.length}명</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>미배정 학생</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
                        {students.filter(s => !s.class_id).length}명
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text" placeholder="이름 또는 학교명으로 검색..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '12px 12px 12px 48px', color: 'white', fontSize: '15px', outline: 'none' }}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>이름 / 학교</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>소속 반</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>연락처</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>생년월일</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500, textAlign: 'right' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>로딩 중...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>검색 결과가 없습니다.</td></tr>
                            ) : filteredStudents.map((student) => (
                                <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}>
                                                {student.name[0]}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{student.name}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <School size={11} /> {student.school || '미입력'} • {student.grade || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', whiteSpace: 'nowrap' }}>
                                            {student.classes?.name || '미배정'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            <Phone size={12} /> {student.parent_contact || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={12} /> {student.birth_date || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                            <button onClick={() => { setSelectedStudent(student); setIsQRModalOpen(true); }} style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }} title="QR"><QrCode size={14} /></button>
                                            <button onClick={() => handleOpenEditModal(student)} style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }} title="수정"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(student.id, student.name)} style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }} title="삭제"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content">
                            <div className="modal-header">
                                <h2>{editingStudent ? '학생 정보 수정' : '신규 학생 등록'}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} style={{ color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>학생 이름*</label>
                                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="이름을 입력하세요" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>소속 학교</label>
                                        <input value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} placeholder="예: 아이디어초" />
                                    </div>
                                    <div className="form-group">
                                        <label>학년</label>
                                        <input value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} placeholder="예: 5학년" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>생년월일</label>
                                        <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>반 선택</label>
                                        <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })}>
                                            <option value="">반을 선택하세요</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>학부모 연락처</label>
                                    <input value={formData.parentContact} onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })} placeholder="010-0000-0000" />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="cancel-btn">취소</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2 }}>{editingStudent ? '수정 완료' : '등록 하기'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Modal */}
            <AnimatePresence>
                {isQRModalOpen && selectedStudent && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" style={{ maxWidth: '360px', textAlign: 'center' }}>
                            <div className="modal-header">
                                <h2>학생 QR 코드</h2>
                                <button onClick={() => setIsQRModalOpen(false)} style={{ color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>{selectedStudent.name} 학생 전용 코드입니다.</p>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px' }}>
                                <QRCodeCanvas
                                    id="student-qr-canvas"
                                    value={selectedStudent.qr_code_data}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={downloadQR}>이미지로 저장하기</button>
                                <button className="cancel-btn" style={{ width: '100%' }} onClick={() => setIsQRModalOpen(false)}>닫기</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`toast ${showToast.type}`}>
                        {showToast.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
                        {showToast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10001; padding: 20px; }
                .modal-content { background: #0f172a; border: 1px solid var(--card-border); border-radius: 24px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-form { display: flex; flex-direction: column; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                label { font-size: 14px; font-weight: 500; color: #94a3b8; }
                input, select { background: rgba(0, 0, 0, 0.4); border: 1px solid var(--card-border); border-radius: 12px; padding: 12px 16px; color: white; font-size: 15px; outline: none; }
                .modal-footer { display: flex; gap: 12px; margin-top: 12px; }
                .cancel-btn { flex: 1; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.05); color: white; border: none; font-weight: 600; cursor: pointer; }
                .toast { position: fixed; bottom: 30px; right: 30px; padding: 16px 24px; border-radius: 12px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); border: 1px solid var(--card-border); color: white; display: flex; alignItems: center; gap: 10px; z-index: 9999; }
                .toast.success { border-left: 4px solid #10b981; }
                .toast.error { border-left: 4px solid #ef4444; }
            `}</style>
        </div>
    );
}
