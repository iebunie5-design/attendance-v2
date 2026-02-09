'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    User,
    Bell,
    Shield,
    Info,
    ChevronRight,
    X,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const [activeModal, setActiveModal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(null);

    // Profile State
    const [profileData, setProfileData] = useState({
        academyName: '아이디어큐브 아름/SW코딩',
        directorName: '이순남 원장님',
        contact: '010-0000-0000',
        location: '1호실'
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Alimtalk State
    const [msgTemplates, setMsgTemplates] = useState({
        entry: '[아이디어큐브] {name} 학생이 {time}에 출석하였습니다.',
        exit: '[아이디어큐브] {name} 학생이 {time}에 하원하였습니다.'
    });

    const triggerToast = (message, type = 'success') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // TODO: Supabase DB 연동 (v2.1 예정)
        // 임시로 성공 메시지만 표시
        triggerToast('프로필 정보가 저장되었습니다.');
        setActiveModal(null);
        setLoading(false);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            triggerToast('새 비밀번호가 일치하지 않습니다.', 'error');
            return;
        }
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: passwordData.new
        });

        if (error) {
            triggerToast(error.message, 'error');
        } else {
            triggerToast('비밀번호가 성공적으로 변경되었습니다.');
            setActiveModal(null);
            setPasswordData({ current: '', new: '', confirm: '' });
        }
        setLoading(false);
    };

    const sections = [
        {
            title: '계정 설정',
            icon: User,
            items: [
                { id: 'profile', text: '프로필 수정' },
                { id: 'teacher', text: '강사 권한 관리' },
                { id: 'info', text: '조직/지점 정보' }
            ]
        },
        {
            title: '알림 및 서비스',
            icon: Bell,
            items: [
                { id: 'sms', text: '알림톡 템플릿 설정' },
                { id: 'trigger', text: '자동 문자 발송 트리거' },
                { id: 'push', text: '푸시 알림' }
            ]
        },
        {
            title: '보안 및 데이터',
            icon: Shield,
            items: [
                { id: 'password', text: '비밀번호 변경' },
                { id: 'history', text: '로그인 기록' },
                { id: 'backup', text: '데이터 백업/복구' }
            ]
        },
        {
            title: '앱 정보',
            icon: Info,
            items: [
                { id: 'version', text: '버전 정보 (v1.0.0-MVP)' },
                { id: 'terms', text: '이용 약관' },
                { id: 'support', text: '고객 지원' }
            ]
        },
    ];

    const handleExportData = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('students').select('*, classes(name)');

        if (error) {
            triggerToast('데이터를 불러오는데 실패했습니다.', 'error');
        } else if (data) {
            const headers = ['이름', '학교', '학년', '연락처', '생년월일', '배정 반'];
            const rows = data.map(s => [
                s.name,
                s.school || '',
                s.grade || '',
                s.parent_contact || '',
                s.birth_date || '',
                s.classes?.name || '미배정'
            ]);

            let csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `학생명단_백업_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            triggerToast('CSV 파일이 생성되었습니다.');
        }
        setLoading(false);
    };

    const handleItemClick = (id) => {
        if (id === 'profile') setActiveModal('profile');
        else if (id === 'password') setActiveModal('password');
        else if (id === 'sms') setActiveModal('sms');
        else if (id === 'backup') handleExportData();
        else triggerToast('준비 중인 기능입니다.');
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ marginBottom: '8px' }}>설정</h1>
                <p>시스템 설정 및 서비스 정보를 관리할 수 있습니다.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {sections.map((section) => (
                    <div key={section.title} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <section.icon size={20} color="#6366f1" />
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{section.title}</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.id)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 12px',
                                        borderRadius: '8px',
                                        color: '#94a3b8',
                                        fontSize: '15px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'var(--transition-smooth)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {item.text}
                                    <ChevronRight size={18} color="#475569" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {activeModal === 'profile' && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content">
                            <div className="modal-header">
                                <h2>학원 및 프로필 정보 수정</h2>
                                <button onClick={() => setActiveModal(null)} className="close-btn"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleProfileSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>학원 명칭</label>
                                    <input value={profileData.academyName} onChange={(e) => setProfileData({ ...profileData, academyName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>원장님 성함</label>
                                    <input value={profileData.directorName} onChange={(e) => setProfileData({ ...profileData, directorName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>연락처</label>
                                    <input value={profileData.contact} onChange={(e) => setProfileData({ ...profileData, contact: e.target.value })} />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setActiveModal(null)} className="cancel-btn">취소</button>
                                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? '저장 중...' : '변경 내용 저장'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Alimtalk Modal */}
            <AnimatePresence>
                {activeModal === 'sms' && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" style={{ maxWidth: '480px' }}>
                            <div className="modal-header">
                                <h2>알림톡 템플릿 설정</h2>
                                <button onClick={() => setActiveModal(null)} className="close-btn"><X size={24} /></button>
                            </div>
                            <div className="modal-form">
                                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
                                    메시지 내용 중 <span style={{ color: '#6366f1' }}>{'{name}'}</span>은 학생 이름, <span style={{ color: '#6366f1' }}>{'{time}'}</span>은 현재 시간으로 자동 치환됩니다.
                                </p>
                                <div className="form-group">
                                    <label>출석 알림 메시지</label>
                                    <textarea
                                        rows={3}
                                        value={msgTemplates.entry}
                                        onChange={(e) => setMsgTemplates({ ...msgTemplates, entry: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', resize: 'none' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label>하원 알림 메시지</label>
                                    <textarea
                                        rows={3}
                                        value={msgTemplates.exit}
                                        onChange={(e) => setMsgTemplates({ ...msgTemplates, exit: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', resize: 'none' }}
                                    />
                                </div>
                                <div className="modal-footer" style={{ marginTop: '24px' }}>
                                    <button type="button" onClick={() => setActiveModal(null)} className="cancel-btn">취소</button>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => { triggerToast('템플릿이 저장되었습니다.'); setActiveModal(null); }}
                                    >
                                        저장 완료
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Password Modal */}
            <AnimatePresence>
                {activeModal === 'password' && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content">
                            <div className="modal-header">
                                <h2>비밀번호 변경</h2>
                                <button onClick={() => setActiveModal(null)} className="close-btn"><X size={24} /></button>
                            </div>
                            <form onSubmit={handlePasswordSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>현재 비밀번호</label>
                                    <input type="password" required value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>새 비밀번호</label>
                                    <input type="password" required minLength={6} value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>새 비밀번호 확인</label>
                                    <input type="password" required value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setActiveModal(null)} className="cancel-btn">취소</button>
                                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? '변경 중...' : '비밀번호 갱신'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`toast ${showToast.type}`}>
                        {showToast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {showToast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
