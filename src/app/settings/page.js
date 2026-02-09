'use client';

import {
    Settings,
    User,
    Bell,
    Shield,
    Smartphone,
    Info,
    ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
    const sections = [
        { title: '계정 설정', icon: User, items: ['프로필 수정', '강사 권한 관리', '조직/지점 정보'] },
        { title: '알림 및 서비스', icon: Bell, items: ['알림톡 템플릿 설정', '자동 문자 발송 트리거', '푸시 알림'] },
        { title: '보안 및 데이터', icon: Shield, items: ['비밀번호 변경', '로그인 기록', '데이터 백업/복구'] },
        { title: '앱 정보', icon: Info, items: ['버전 정보 (v1.0.0-MVP)', '이용 약관', '고객 지원'] },
    ];

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
                                    key={item}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 12px',
                                        borderRadius: '8px',
                                        color: '#94a3b8',
                                        fontSize: '15px',
                                        transition: 'var(--transition-smooth)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {item}
                                    <ChevronRight size={18} color="#475569" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
