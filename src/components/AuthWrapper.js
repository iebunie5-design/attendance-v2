'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Loader2 } from 'lucide-react';

export default function AuthWrapper({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);

            if (!session && pathname !== '/login') {
                router.push('/login');
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session && pathname !== '/login') {
                router.push('/login');
            } else if (session && pathname === '/login') {
                router.push('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [pathname, router]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#060608',
                color: '#6366f1'
            }}>
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    // If on login page, just show children
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // If not logged in and not loading, we'll be redirected anyway, 
    // but let's avoid flicker of dashboard
    if (!session) {
        return null;
    }

    return (
        <div className="main-container">
            <Sidebar />
            <main className="content-wrapper">
                {children}
            </main>
            <MobileNav />
        </div>
    );
}
