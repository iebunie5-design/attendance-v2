'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Check,
    Clock,
    X,
    LogOut,
    Save,
    ChevronLeft,
    Search,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const STATUS_CONFIG = {
    P: { label: '출석', color: '#10b981', icon: Check, class: 'status-present' },
    L: { label: '지각', color: '#8b5cf6', icon: Clock, class: 'status-late' },
    A: { label: '결석', color: '#ef4444', icon: X, class: 'status-absent' },
    E: { label: '조퇴', color: '#f59e0b', icon: LogOut, class: 'status-early' },
};

export default function AttendancePage() {
    const router = useRouter();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const searchParams = useSearchParams();
    const classIdFromQuery = searchParams.get('classId');

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('id, name');
        setClasses(data || []);

        // URL 쿼리에 반 ID가 있으면 해당 반을 먼저 선택, 없으면 첫 번째 반 선택
        if (classIdFromQuery) {
            setSelectedClass(classIdFromQuery);
        } else if (data && data.length > 0) {
            setSelectedClass(data[0].id);
        }
    };

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsAndAttendance();
        }
    }, [selectedClass, selectedDate]);

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        const { data: studentList } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', selectedClass)
            .order('name');

        setStudents(studentList || []);

        const { data: existingAttendance } = await supabase
            .from('attendance')
            .select('student_id, status, memo')
            .eq('class_id', selectedClass)
            .eq('date', selectedDate);

        const mapping = {};
        existingAttendance?.forEach(record => {
            mapping[record.student_id] = { status: record.status, memo: record.memo };
        });
        setAttendanceData(mapping);
        setLoading(false);
    };

    const triggerToast = (message, type = 'success') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    const updateStatus = (studentId, status) => {
        setAttendanceData(prev => {
            const currentStatus = prev[studentId]?.status;
            // If clicking the same status, deselect it (delete)
            const newStatus = currentStatus === status ? null : status;
            return {
                ...prev,
                [studentId]: { ...prev[studentId], status: newStatus }
            };
        });
    };

    const updateMemo = (studentId, memo) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], memo }
        }));
    };

    const handleSave = async () => {
        setSaveLoading(true);

        const records = Object.keys(attendanceData)
            .filter(sid => attendanceData[sid].status)
            .map(studentId => ({
                student_id: studentId,
                class_id: selectedClass,
                date: selectedDate,
                status: attendanceData[studentId].status,
                memo: attendanceData[studentId].memo || ''
            }));

        // Always delete first for this class/date
        const { error: delError } = await supabase
            .from('attendance')
            .delete()
            .eq('class_id', selectedClass)
            .eq('date', selectedDate);

        if (delError) {
            triggerToast('저장 중 오류가 발생했습니다.', 'error');
            setSaveLoading(false);
            return;
        }

        if (records.length > 0) {
            const { error: insError } = await supabase.from('attendance').insert(records);
            if (insError) triggerToast('저장 중 오류가 발생했습니다.', 'error');
            else triggerToast('출결 정보가 성공적으로 저장되었습니다.');
        } else {
            triggerToast('모든 출결 기록이 삭제되었습니다.');
        }

        setSaveLoading(false);
    };

    const handleReset = async () => {
        if (!confirm('현재 반의 출결 기록과 등록된 학생 명단을 모두 삭제하시겠습니까?\n이 작업은 학생 정보 자체를 시스템에서 영구히 삭제합니다.')) return;

        setSaveLoading(true);

        // 1. 해당 날짜/반의 모든 출결 기록 삭제
        const { error: attError } = await supabase
            .from('attendance')
            .delete()
            .eq('class_id', selectedClass)
            .eq('date', selectedDate);

        // 2. 해당 반에 소속된 모든 학생 삭제 (사용자 요청 반영)
        const { error: studentError } = await supabase
            .from('students')
            .delete()
            .eq('class_id', selectedClass);

        if (attError || studentError) {
            triggerToast('초기화 중 오류가 발생했습니다.', 'error');
        } else {
            setAttendanceData({});
            setStudents([]);
            triggerToast('출결 기록과 학생 명단이 모두 삭제되었습니다.');
        }
        setSaveLoading(false);
    };

    const setAllPresent = () => {
        const newData = { ...attendanceData };
        students.forEach(s => {
            newData[s.id] = { ...newData[s.id], status: 'P' };
        });
        setAttendanceData(newData);
    };

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>출결 기록</h1>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--card-border)',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                            <Calendar size={14} style={{ marginRight: '6px', color: '#6366f1' }} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ background: 'none', border: 'none', color: 'white', fontSize: '14px', outline: 'none', colorScheme: 'dark' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '500px' }}>
                    <button onClick={setAllPresent} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '10px', border: '1px solid var(--card-border)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        전원 출석
                    </button>
                    <button onClick={handleReset} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <Trash2 size={16} /> 기록 초기화
                    </button>
                    <button onClick={handleSave} disabled={saveLoading} className="btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', justifyContent: 'center', fontSize: '13px' }}>
                        {saveLoading ? '저장...' : <><Save size={16} /> 기록 저장</>}
                    </button>
                </div>
            </header>

            {/* Content Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-controls" style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
                        <span>총 {students.length}명</span>
                    </div>
                    <div style={{ position: 'relative', flex: '1', maxWidth: '200px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                        <input
                            type="text" placeholder="이름 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '6px 10px 6px 32px', color: 'white', fontSize: '13px', outline: 'none', width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>학생 이름</th>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>출결 체크</th>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>메모</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>로딩 중...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>해당 반에 학생이 없습니다.</td></tr>
                            ) : filteredStudents.map((student) => (
                                <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                                {student.name[0]}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{student.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                                const Icon = config.icon;
                                                const isActive = attendanceData[student.id]?.status === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => updateStatus(student.id, key)}
                                                        title={isActive ? "선택 취소" : config.label}
                                                        style={{
                                                            padding: '6px 10px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                                                            background: isActive ? `${config.color}20` : 'rgba(255,255,255,0.03)',
                                                            color: isActive ? config.color : '#64748b',
                                                            border: `1px solid ${isActive ? config.color : 'transparent'}`,
                                                            transition: 'all 0.1s'
                                                        }}
                                                    >
                                                        {isActive ? <CheckCircle2 size={12} /> : <Icon size={12} />} {config.label}
                                                    </button>
                                                );
                                            })}
                                            {attendanceData[student.id]?.status && (
                                                <button
                                                    onClick={() => updateStatus(student.id, attendanceData[student.id]?.status)}
                                                    style={{ padding: '6px', borderRadius: '8px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    title="기록 삭제"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <input
                                            type="text"
                                            placeholder="메모 입력..."
                                            value={attendanceData[student.id]?.memo || ''}
                                            onChange={(e) => updateMemo(student.id, e.target.value)}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '6px', padding: '8px 12px', color: '#94a3b8', fontSize: '13px', outline: 'none', width: '100%'
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className={`toast ${showToast.type}`}
                    >
                        {showToast.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
                        {showToast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
