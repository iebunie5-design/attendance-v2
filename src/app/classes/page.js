'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Calendar,
    User,
    ChevronRight,
    BookOpen,
    Trash2,
    Edit3,
    X,
    MapPin,
    Users,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from '@/lib/supabase';

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [showToast, setShowToast] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        teacher: '',
        schedule: '',
        room: '',
    });

    // 1. 초기 데이터 불러오기 (Read)
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        // classes 테이블을 가져오면서, 연관된 students 테이블의 개수를 함께 가져옵니다.
        const { data, error } = await supabase
            .from('classes')
            .select(`
                *,
                student_count:students(count)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            triggerToast('데이터를 가져오는데 실패했습니다.', 'error');
        } else {
            // supabase에서 반환된 count 데이터 구조를 가공합니다.
            const formattedData = data.map(cls => ({
                ...cls,
                students: cls.student_count?.[0]?.count || 0
            }));
            setClasses(formattedData || []);
        }
        setLoading(false);
    };

    // 토스트 메시지 제어
    const triggerToast = (message, type = 'success') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    // 모달 제어
    const openAddModal = () => {
        setEditingClass(null);
        setFormData({ name: '', teacher: '', schedule: '', room: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (cls) => {
        setEditingClass(cls);
        setFormData({ ...cls });
        setIsModalOpen(true);
    };

    // 2. 삭제 처리 (Delete)
    const handleDelete = async (id, name) => {
        if (confirm(`'${name}' 반을 정말 삭제하시겠습니까?`)) {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', id);

            if (error) {
                triggerToast('삭제 중 오류가 발생했습니다.', 'error');
            } else {
                setClasses(classes.filter(c => c.id !== id));
                triggerToast('반이 성공적으로 삭제되었습니다.');
            }
        }
    };

    // 3. 등록/수정 전송 (Create / Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
        };

        if (editingClass) {
            // 수정
            const { error } = await supabase
                .from('classes')
                .update({
                    name: formData.name,
                    teacher: formData.teacher,
                    schedule: formData.schedule,
                    room: formData.room
                })
                .eq('id', editingClass.id);

            if (error) {
                triggerToast('수정 중 오류가 발생했습니다.', 'error');
            } else {
                fetchClasses();
                triggerToast('반 정보가 수정되었습니다.');
            }
        } else {
            // 추가
            const { error } = await supabase
                .from('classes')
                .insert([payload]);

            if (error) {
                triggerToast('반 개설 중 오류가 발생했습니다.', 'error');
            } else {
                fetchClasses();
                triggerToast('새로운 반이 개설되었습니다.');
            }
        }
        setIsModalOpen(false);
    };

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
                    <h1 style={{ marginBottom: '8px' }}>반 관리</h1>
                    <p>학원의 모든 정규 수업과 담당 강사를 관리합니다.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}
                >
                    <Plus size={20} />
                    <span className="hide-mobile">새로운 반 개설</span><span className="show-mobile">반 추가</span>
                </button>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
            }}>
                <AnimatePresence mode="popLayout">
                    {classes.map((cls, idx) => (
                        <motion.div
                            key={cls.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="card"
                            style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '24px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <BookOpen size={24} color="#6366f1" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => openEditModal(cls)}
                                            className="action-btn edit"
                                            title="수정"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cls.id, cls.name)}
                                            className="action-btn delete"
                                            title="삭제"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>{cls.name}</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                    <div className="info-item">
                                        <User size={16} color="#6366f1" /> <span>강사: {cls.teacher}</span>
                                    </div>
                                    <div className="info-item">
                                        <Calendar size={16} color="#6366f1" /> <span>일정: {cls.schedule}</span>
                                    </div>
                                    <div className="info-item">
                                        <Users size={16} color="#6366f1" /> <span>학생 수: {cls.students}명</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: '16px 24px',
                                background: 'rgba(255,255,255,0.02)',
                                borderTop: '1px solid var(--card-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                                    <MapPin size={14} /> {cls.room}
                                </div>
                                <button
                                    className="detail-btn"
                                    onClick={() => router.push(`/attendance?classId=${cls.id}`)}
                                >
                                    상세보기 <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty Add Card */}
                <motion.div
                    onClick={openAddModal}
                    whileHover={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.02)' }}
                    className="add-placeholder-card"
                >
                    <div className="plus-icon-wrapper">
                        <Plus size={24} color="#64748b" />
                    </div>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>새 반 추가하기</span>
                </motion.div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal-content"
                        >
                            <div className="modal-header">
                                <h1>{editingClass ? '반 정보 수정' : '새로운 반 개설'}</h1>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>반 이름</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="예: 중2 파이썬 A반"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>담당 강사</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.teacher}
                                            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                                            placeholder="강사명"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>강의실</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.room}
                                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                            placeholder="예: 101호"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>수업 일정</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.schedule}
                                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                        placeholder="예: 월, 수 16:00"
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">
                                        취소
                                    </button>
                                    <button type="submit" className="btn-primary submit-btn">
                                        {editingClass ? '수정 완료' : '반 개설하기'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`toast ${showToast.type}`}
                    >
                        {showToast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {showToast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .info-item { display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 14px; }
                .action-btn { padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: #94a3b8; border: none; cursor: pointer; transition: all 0.2s; }
                .action-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
                .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .action-btn.edit:hover { color: #6366f1; }
                .detail-btn { color: #6366f1; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 4px; background: transparent; border: none; cursor: pointer; }
                .add-placeholder-card {
                    border: 2px dashed var(--card-border);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                }
                .plus-icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.03);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                }
            `}</style>
        </div>
    );
}
