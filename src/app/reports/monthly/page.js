'use client';

import { useState, useEffect } from 'react';
import {
    ChevronDown,
    Printer,
    Calendar as CalendarIcon,
    Loader2,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const STATUS_MAP = {
    'P': { color: '#10b981', label: '출' },
    'L': { color: '#8b5cf6', label: '지' },
    'A': { color: '#ef4444', label: '결' },
    'E': { color: '#f59e0b', label: '조' },
};

export default function MonthlyAttendance() {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [daysInMonth, setDaysInMonth] = useState([]);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass && selectedMonth) {
            fetchMonthlyData();
        }
    }, [selectedClass, selectedMonth]);

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('id, name');
        setClasses(data || []);
        if (data && data.length > 0) {
            setSelectedClass(data[0].id);
        } else {
            setLoading(false);
        }
    };

    const fetchMonthlyData = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-').map(Number);

            // 1. Generate Days in Month
            const lastDay = new Date(year, month, 0).getDate();
            const days = [];
            const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
            for (let i = 1; i <= lastDay; i++) {
                const dateObj = new Date(year, month - 1, i);
                days.push({ date: i, day: dayLabels[dateObj.getDay()] });
            }
            setDaysInMonth(days);

            // 2. Fetch Students for this class
            const { data: studentList } = await supabase
                .from('students')
                .select('id, name')
                .eq('class_id', selectedClass)
                .order('name');
            setStudents(studentList || []);

            // 3. Fetch Attendance for this class and month
            const startDate = `${selectedMonth}-01`;
            const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

            const { data: attRecords } = await supabase
                .from('attendance')
                .select('student_id, date, status')
                .eq('class_id', selectedClass)
                .gte('date', startDate)
                .lte('date', endDate);

            // 4. Map attendance data for easy lookup: { studentId: { date: status } }
            const mappedAtt = {};
            attRecords?.forEach(record => {
                const sId = record.student_id;
                const dateNum = new Date(record.date).getDate();
                if (!mappedAtt[sId]) mappedAtt[sId] = {};
                mappedAtt[sId][dateNum] = record.status;
            });
            setAttendanceData(mappedAtt);

        } catch (err) {
            console.error('Error fetching monthly data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getSelectedClassName = () => {
        return classes.find(c => c.id === selectedClass)?.name || '';
    };

    return (
        <div className="monthly-attendance" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header className="page-header no-print" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ flex: '1', minWidth: '240px' }}>
                    <h1 style={{ marginBottom: '8px' }}>월간 출석부</h1>
                    <p>반별 월간 출결 현황을 실시간 DB 데이터로 확인하고 인쇄합니다.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: 'fit-content' }}>
                    {/* Class Selector */}
                    <div style={{ position: 'relative', flex: '1', minWidth: '140px' }}>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            style={{
                                appearance: 'none',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                padding: '10px 32px 10px 12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                width: '100%'
                            }}
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
                    </div>

                    {/* Month Picker */}
                    <div style={{ flex: '1', minWidth: '140px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CalendarIcon size={14} style={{ marginRight: '6px', color: '#6366f1' }} />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '13px', outline: 'none', cursor: 'pointer', colorScheme: 'dark', width: '100%' }}
                        />
                    </div>
                    <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 16px' }}>
                        <Printer size={16} /> <span className="hide-mobile">출석부 출력</span><span className="show-mobile">인쇄</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <Loader2 className="animate-spin" size={32} />
                    <span style={{ marginLeft: '12px' }}>데이터를 불러오는 중...</span>
                </div>
            ) : (
                <div className="card print-container" style={{ padding: '0', overflow: 'hidden', minHeight: '400px' }}>
                    <div className="print-header" style={{ display: 'none', padding: '20px' }}>
                        <h1 style={{ textAlign: 'center', color: 'black', fontSize: '24px', marginBottom: '10px' }}>월간 출석부</h1>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'black', borderBottom: '2px solid black', paddingBottom: '10px' }}>
                            <span><strong>반 이름:</strong> {getSelectedClassName()}</span>
                            <span><strong>대상월:</strong> {selectedMonth.replace('-', '년 ')}월</span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="attendance-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', color: '#64748b' }}>
                                    <th style={{ padding: '12px 10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', minWidth: '70px', background: 'rgba(255,255,255,0.03)' }}>이름</th>
                                    {daysInMonth.map((day) => (
                                        <th key={day.date} style={{
                                            padding: '6px 2px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            textAlign: 'center',
                                            minWidth: '28px',
                                            background: day.day === '토' ? 'rgba(56, 189, 248, 0.05)' : day.day === '일' ? 'rgba(248, 113, 113, 0.05)' : 'transparent'
                                        }}>
                                            <div style={{ fontSize: '10px', color: day.day === '일' ? '#ef4444' : day.day === '토' ? '#0ea5e9' : '#64748b' }}>{day.day}</div>
                                            <div style={{ fontWeight: 700, color: 'white' }}>{day.date}</div>
                                        </th>
                                    ))}
                                    <th style={{ padding: '12px 5px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981' }}>출</th>
                                    <th style={{ padding: '12px 5px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: 'rgba(139, 92, 246, 0.05)', color: '#8b5cf6' }}>지</th>
                                    <th style={{ padding: '12px 5px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }}>결</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? students.map((student) => {
                                    const studentAtt = attendanceData[student.id] || {};
                                    const pCount = Object.values(studentAtt).filter(v => v === 'P').length;
                                    const lCount = Object.values(studentAtt).filter(v => v === 'L').length;
                                    const aCount = Object.values(studentAtt).filter(v => v === 'A').length;

                                    return (
                                        <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '10px 10px', fontWeight: 600 }}>{student.name}</td>
                                            {daysInMonth.map((day) => {
                                                const status = studentAtt[day.date];
                                                const config = STATUS_MAP[status];
                                                return (
                                                    <td key={day.date} style={{ padding: '4px 2px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                                        {status ? (
                                                            <span style={{ fontSize: '10px', fontWeight: 900, color: config.color, display: 'inline-block', width: '18px', height: '18px', lineHeight: '18px', borderRadius: '4px', background: `${config.color}20` }}>
                                                                {config.label}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ padding: '10px 5px', textAlign: 'center', color: '#10b981', fontWeight: 800 }}>{pCount}</td>
                                            <td style={{ padding: '10px 5px', textAlign: 'center', color: '#8b5cf6', fontWeight: 800 }}>{lCount}</td>
                                            <td style={{ padding: '10px 5px', textAlign: 'center', color: '#ef4444', fontWeight: 800 }}>{aCount}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={daysInMonth.length + 4} style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <Users size={32} />
                                                이 반에는 등록된 학생이 없습니다.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="no-print" style={{ marginTop: '24px', display: 'flex', gap: '20px', color: '#64748b', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }}></span> 출석 (P)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#8b5cf6' }}></span> 지각 (L)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }}></span> 결석 (A)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }}></span> 조퇴 (E)</div>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
                    .no-print { display: none !important; }
                    .main-container { padding: 0 !important; width: 100% !important; margin: 0 !important; }
                    .sidebar { display: none !important; }
                    .content-wrapper { padding: 0 !important; margin: 0 !important; width: 100% !important; }
                    .card { background: white !important; border: none !important; box-shadow: none !important; color: black !important; }
                    .print-header { display: block !important; }
                    .attendance-table { border-collapse: collapse !important; width: 100% !important; color: black !important; border: 1px solid black !important; }
                    .attendance-table th, .attendance-table td { border: 1px solid #000 !important; color: black !important; padding: 6px 2px !important; }
                    .attendance-table th { background: #f0f0f0 !important; }
                    .attendance-table div { color: black !important; }
                    span { color: black !important; background: transparent !important; }
                    @page { size: A4 landscape; margin: 10mm; }
                }
            `}</style>
        </div>
    );
}
