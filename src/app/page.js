'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch Total Students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Today's Attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('status, class_id')
        .eq('date', today);

      // 3. Fetch Classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, teacher');

      // Calculate Statistics
      const presentCount = attendance?.filter(a => a.status === 'P').length || 0;
      const lateCount = attendance?.filter(a => a.status === 'L').length || 0;
      const absentCount = attendance?.filter(a => a.status === 'A').length || 0;
      const attRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      setStats([
        { name: '오늘 출석', value: presentCount.toString(), total: totalStudents?.toString(), icon: CheckCircle2, color: '#10b981' },
        { name: '지각', value: lateCount.toString(), icon: Clock, color: '#f59e0b' },
        { name: '결석', value: absentCount.toString(), icon: XCircle, color: '#ef4444' },
        { name: '출석률', value: `${attRate}%`, icon: TrendingUp, color: '#6366f1' },
      ]);

      // Map today's classes with status
      const mappedClasses = classes?.map(c => {
        const classAtt = attendance?.filter(a => a.class_id === c.id) || [];
        let status = 'pending';
        if (classAtt.length > 0) {
          status = 'completed';
        }

        return {
          id: c.id,
          name: c.name,
          teacher: c.teacher,
          status: status,
          present: classAtt.filter(a => a.status === 'P').length,
          total: totalStudents // This is a simplification, should ideally be students in that class
        };
      }) || [];

      // Improved class student count
      const { data: classStudentCounts } = await supabase
        .from('students')
        .select('class_id');

      const finalMappedClasses = mappedClasses.map(c => {
        const studentCount = classStudentCounts?.filter(s => s.class_id === c.id).length || 0;
        return { ...c, total: studentCount };
      });

      setTodayClasses(finalMappedClasses);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: '12px', fontSize: '18px' }}>대시보드 로딩 중...</span>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="dashboard-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>대시보드</h1>
          <p>오늘의 아이디어큐브 아름/SW코딩 현황을 실시간으로 확인하세요.</p>
        </div>
        <Link href="/students">
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
            <Plus size={20} />
            새 학생 등록
          </button>
        </Link>
      </header>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{stat.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700 }}>{stat.value}</span>
              {stat.total && <span style={{ color: '#64748b' }}>/ {stat.total}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        {/* Today's Classes */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>오늘 수업 현황</h2>
            <Link href="/attendance">
              <button style={{ color: '#6366f1', fontSize: '14px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>전체 기록</button>
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {todayClasses.length > 0 ? todayClasses.map((cls) => (
              <Link href="/attendance" key={cls.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }} className="class-item-hover">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    flexShrink: 0
                  }}>
                    <Calendar size={18} color="#94a3b8" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{cls.total}명 등록됨</div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: cls.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: cls.status === 'completed' ? '#34d399' : '#94a3b8',
                      marginBottom: '4px'
                    }}>
                      {cls.status === 'completed' ? '완료' : '대기'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {cls.present}/{cls.total}
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                오늘 수업 정보가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Quick Notices */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>알람 및 공지</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.05)',
              borderLeft: '4px solid #6366f1'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1', marginBottom: '4px' }}>실시간 데이터 연동</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Supabase DB와 실시간 연동 중입니다.</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .class-item-hover:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
