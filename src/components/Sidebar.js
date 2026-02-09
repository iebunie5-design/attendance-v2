'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Plus,
  QrCode
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: '홈', icon: LayoutDashboard, path: '/' },
    { name: '출결 기록', icon: BookOpen, path: '/attendance' },
    { name: 'QR 출결(키오스크)', icon: QrCode, path: '/qr' },
    { name: '반 관리', icon: Plus, path: '/classes' },
    { name: '학생 관리', icon: Users, path: '/students' },
    { name: '통계/레포트', icon: BarChart3, path: '/reports' },
    { name: '설정', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="sidebar glass">
      <div style={{ padding: '32px 24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '40px',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '40px',
            minWidth: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20px'
          }}>
            I
          </div>
          <span className="logo-text" style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
            IDEACUBE
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    color: isActive ? 'white' : '#94a3b8',
                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  <Icon size={20} color={isActive ? '#6366f1' : '#94a3b8'} style={{ minWidth: '20px' }} />
                  <span className="menu-text">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      style={{
                        marginLeft: 'auto',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#6366f1'
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid var(--glass-border)' }}>
        <div className="user-info" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '8px',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '36px',
            minWidth: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            원장
          </div>
          <div className="user-info-text">
            <div style={{ fontSize: '14px', fontWeight: 600 }}>김원장 님</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Admin</div>
          </div>
        </div>
        <button className="logout-button" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#f87171',
          padding: '8px',
          width: '100%',
          fontSize: '14px',
          justifyContent: 'center'
        }}>
          <LogOut size={16} />
          <span className="menu-text">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
