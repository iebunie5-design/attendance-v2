'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3,
    Download,
    TrendingUp,
    Users,
    Calendar as CalendarIcon,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Printer,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        weeklyRate: 0,
        weeklyTrend: [],
        topStudents: [],
        classSummary: []
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Get all classes for summary
            const { data: classes } = await supabase.from('classes').select('id, name, teacher');

            // 2. Get all students
            const { data: students } = await supabase.from('students').select('id, name');

            // 3. Get attendance for the last 30 days (for general stats)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: attendance } = await supabase
                .from('attendance')
                .select('*')
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

            // --- Calculate Weekly Trend ---
            const days = ['월', '화', '수', '목', '금', '토', '일'];
            const today = new Date();
            const weeklyTrend = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = days[(d.getDay() + 6) % 7]; // Adjust so 0 is Mon

                const dailyRecords = attendance?.filter(a => a.date === dateStr) || [];
                const rate = dailyRecords.length > 0
                    ? Math.round((dailyRecords.filter(r => r.status === 'P').length / dailyRecords.length) * 100)
                    : 0;

                weeklyTrend.push({ day: dayName, rate });
            }

            // --- Calculate Top Students ---
            const studentStats = students?.map(s => {
                const records = attendance?.filter(a => a.student_id === s.id) || [];
                const rate = records.length > 0
                    ? Math.round((records.filter(r => r.status === 'P').length / records.length) * 100)
                    : 0;
                return { name: s.name, rate, status: rate > 90 ? 'up' : 'down' };
            }).sort((a, b) => b.rate - a.rate).slice(0, 5) || [];

            // --- Calculate Class Summary ---
            const classSummary = classes?.map(c => {
                const records = attendance?.filter(a => a.class_id === c.id) || [];
                const present = records.filter(r => r.status === 'P').length;
                const late = records.filter(r => r.status === 'L').length;
                const absent = records.filter(r => r.status === 'A').length;
                const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;

                return {
                    name: c.name,
                    teacher: c.teacher,
                    rate: rate,
                    late: late,
                    absent: absent
                };
            }) || [];

            setStats({
                weeklyRate: weeklyTrend[weeklyTrend.length - 1].rate,
                weeklyTrend,
                topStudents: studentStats,
                classSummary
            });
        } catch (err) {
            console.error('Error fetching statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <Loader2 className="animate-spin" size={32} />
                <span style={{ marginLeft: '12px', fontSize: '18px' }}>데이터 분석 중...</span>
            </div>
        );
    }

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
                    <h1 style={{ marginBottom: '8px' }}>통계 및 레포트</h1>
                    <p>실시간 DB 데이터를 분석한 학원 운영 현황입니다.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href="/reports/monthly">
                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '12px', color: 'white', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Printer size={16} /> <span className="hide-mobile">월간 출석부</span><span className="show-mobile">출석부</span>
                        </button>
                    </Link>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 16px' }}>
                        <Download size={16} /> <span className="hide-mobile">데이터 백업</span><span className="show-mobile">백업</span>
                    </button>
                </div>
            </header>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Weekly Trend Chart */}
                <div className="card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>주간 출석 추이</h2>
                            <p style={{ fontSize: '14px', color: '#94a3b8' }}>최근 7일간의 일별 출석률</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{stats.weeklyRate}%</div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>현재 평균</div>
                        </div>
                    </div>

                    <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px' }}>
                        {stats.weeklyTrend.map((data, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '10%' }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${data.rate || 5}%` }}
                                    transition={{ delay: idx * 0.05, duration: 0.8, ease: "easeOut" }}
                                    style={{
                                        width: '100%',
                                        background: data.rate > 0 ? 'linear-gradient(to top, #6366f1, #0ea5e9)' : 'rgba(255,255,255,0.05)',
                                        borderRadius: '6px 6px 0 0',
                                        position: 'relative',
                                        minHeight: '4px'
                                    }}
                                >
                                    {data.rate > 0 && (
                                        <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 600, color: '#818cf8' }}>
                                            {data.rate}%
                                        </div>
                                    )}
                                </motion.div>
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{data.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Students */}
                <div className="card" style={{ padding: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>성실 학생 TOP 5</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {stats.topStudents.length > 0 ? stats.topStudents.map((st, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{st.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>출석률 {st.rate}%</div>
                                </div>
                                {st.status === 'up' ? (
                                    <ArrowUpRight size={16} color="#10b981" />
                                ) : (
                                    <ArrowDownRight size={16} color="#64748b" />
                                )}
                            </div>
                        )) : (
                            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px' }}>아직 데이터가 부족합니다.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Class Summary */}
            <div className="card" style={{ marginTop: '32px', padding: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>반별 요약 레포트</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', fontSize: '13px', color: '#64748b', borderBottom: '1px solid var(--card-border)' }}>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>반 이름</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>담당 강사</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>평균 출석률</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>지각 횟수</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>결석 횟수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.classSummary.length > 0 ? stats.classSummary.map((c, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>{c.name}</td>
                                    <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{c.teacher}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${c.rate}%`, height: '100%', background: '#10b981' }}></div>
                                            </div>
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>{c.rate}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#8b5cf6' }}>{c.late}회</td>
                                    <td style={{ padding: '16px 20px', color: '#ef4444' }}>{c.absent}회</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>등록된 반 정보가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                tr:hover { background: rgba(255,255,255,0.02); }
            `}</style>
        </div>
    );
}
