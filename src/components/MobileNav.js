'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    QrCode,
    Users,
    Settings
} from 'lucide-react';

export default function MobileNav() {
    const pathname = usePathname();

    const menuItems = [
        { name: '홈', icon: LayoutDashboard, path: '/' },
        { name: '출결', icon: BookOpen, path: '/attendance' },
        { name: 'QR', icon: QrCode, path: '/qr' },
        { name: '학생', icon: Users, path: '/students' },
        { name: '설정', icon: Settings, path: '/settings' },
    ];

    return (
        <nav className="mobile-nav">
            {menuItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;

                return (
                    <Link key={item.path} href={item.path} style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            color: isActive ? '#6366f1' : '#64748b',
                            transition: 'all 0.2s ease'
                        }}>
                            <Icon size={22} />
                            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{item.name}</span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}
