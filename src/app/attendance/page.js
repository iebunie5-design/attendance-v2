'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    Calendar
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

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('id, name');
        setClasses(data || []);
        if (data && data.length > 0) {
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
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
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

        if (records.length === 0) {
            triggerToast('기록할 출결 데이터가 없습니다.', 'error');
            setSaveLoading(false);
            return;
        }

        const { error: delError } = await supabase
            .from('attendance')
            .delete()
            .eq('class_id', selectedClass)
            .eq('date', selectedDate);

        if (delError) {
            triggerToast('저장 중 오류가 발생했습니다.', 'error');
        } else {
            const { error: insError } = await supabase.from('attendance').insert(records);
            if (insError) triggerToast('저장 중 오류가 발생했습니다.', 'error');
            else triggerToast('출결 정보가 성공적으로 저장되었습니다.');
        }
        setSaveLoading(false);
    };

    const setAllPresent = () => {
        const newData = { ...attendanceData };
        students.forEach(s => {
            if (!newData[s.id]) newData[s.id] = { status: 'P', memo: '' };
            else newData[s.id].status = 'P';
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

                <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
                    <button onClick={setAllPresent} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '10px', border: '1px solid var(--card-border)', cursor: 'pointer', fontSize: '13px' }}>
                        전원 출석
                    </button>
                    <button onClick={handleSave} disabled={saveLoading} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', justifyContent: 'center', fontSize: '13px' }}>
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
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                                const Icon = config.icon;
                                                const isActive = attendanceData[student.id]?.status === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => updateStatus(student.id, key)}
                                                        style={{
                                                            padding: '6px 10px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                                                            background: isActive ? `${config.color}20` : 'rgba(255,255,255,0.03)',
                                                            color: isActive ? config.color : '#64748b',
                                                            border: `1px solid ${isActive ? config.color : 'transparent'}`,
                                                            transition: 'all 0.1s'
                                                        }}
                                                    >
                                                        <Icon size={12} /> {config.label}
                                                    </button>
                                                );
                                            })}
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
                        style={{
                            position: 'fixed', bottom: '30px', right: '30px', padding: '16px 24px', borderRadius: '12px',
                            background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid var(--card-border)',
                            color: 'white', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999
                        }}
                    >
                        {showToast.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
                        {showToast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
