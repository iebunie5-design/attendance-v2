'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, ShieldCheck, CheckCircle2, AlertCircle, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function QRAttendancePage() {
    const [scanResult, setScanResult] = useState(null);
    const [lastScanned, setLastScanned] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // 1. 기존 스캐너가 있다면 안전하게 정지 시도
                if (scannerRef.current) {
                    try {
                        if (scannerRef.current.isScanning) {
                            await scannerRef.current.stop();
                        }
                    } catch (e) {
                        // 'not running' 관련 에러는 무시
                    }
                    scannerRef.current = null;
                }

                // 2. 새로운 인스턴스 생성
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 15,
                    qrbox: { width: 280, height: 280 },
                    aspectRatio: 1.0
                };

                // 3. 카메라 시작
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => handleAttendance(decodedText)
                );
            } catch (err) {
                // 이미 스캔 중인 경우 등의 무해한 에러는 무시
                if (!err.toString().includes("is already scanning")) {
                    console.error("Scanner Error:", err);
                }
            }
        };

        startScanner();

        // 클린업: 페이지 이동 시 확실히 종료
        return () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch(() => { });
                    }
                } catch (e) { }
            }
        };
    }, []);

    // 수동 입력 및 출품 로직 유지
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualSearch, setManualSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleManualSearch = async (e) => {
        const val = e.target.value;
        setManualSearch(val);
        if (val.length > 1) {
            const { data } = await supabase
                .from('students')
                .select('id, name, qr_code_data, classes(name)')
                .ilike('name', `%${val}%`)
                .limit(5);
            setSearchResults(data || []);
        } else {
            setSearchResults([]);
        }
    };

    const handleAttendance = async (studentData) => {
        if (isProcessing) return;

        // QR 스캔의 경우 qrValue(string)가 들어오고, 수동 입력의 경우 student 객체가 들어옴
        const isManual = typeof studentData === 'object';
        const identifier = isManual ? studentData.id : studentData;

        if (lastScanned && lastScanned.id === identifier && (Date.now() - lastScanned.time < 8000)) return;

        setIsProcessing(true);
        try {
            let student = isManual ? studentData : null;

            if (!isManual) {
                const { data, error: studentError } = await supabase
                    .from('students')
                    .select('id, name, class_id')
                    .eq('qr_code_data', identifier)
                    .single();
                student = data;
            }

            if (!student) {
                setScanError('학생 정보를 찾을 수 없습니다.');
                setTimeout(() => setScanError(null), 3000);
            } else {
                const today = new Date().toISOString().split('T')[0];
                const { error: attError } = await supabase
                    .from('attendance')
                    .upsert({
                        student_id: student.id,
                        class_id: student.class_id,
                        date: today,
                        status: 'P'
                    }, { onConflict: 'student_id, date' });

                if (attError) throw attError;

                setScanResult({ name: student.name, time: new Date().toLocaleTimeString() });
                setLastScanned({ id: student.id, time: Date.now() });
                setIsManualModalOpen(false);
                setTimeout(() => setScanResult(null), 3000);
            }
        } catch (err) {
            setScanError('출석 처리 중 오류');
            setTimeout(() => setScanError(null), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', marginBottom: '16px' }}>
                    <QrCode color="#6366f1" size={32} />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>QR 출결 키오스크</h1>
                <p style={{ color: '#94a3b8' }}>QR 코드를 카메라 중앙 박스에 맞춰주세요.</p>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}>
                <div id="reader" style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', background: '#000', border: '2px solid rgba(99, 102, 241, 0.3)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '240px', height: '240px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '20px', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '40px', height: '40px', borderTop: '4px solid #6366f1', borderLeft: '4px solid #6366f1', borderTopLeftRadius: '12px' }}></div>
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '40px', height: '40px', borderTop: '4px solid #6366f1', borderRight: '4px solid #6366f1', borderTopRightRadius: '12px' }}></div>
                    <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '40px', height: '40px', borderBottom: '4px solid #6366f1', borderLeft: '4px solid #6366f1', borderBottomLeftRadius: '12px' }}></div>
                    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '40px', height: '40px', borderBottom: '4px solid #6366f1', borderRight: '4px solid #6366f1', borderBottomRightRadius: '12px' }}></div>
                </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', background: 'rgba(12, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '12px', fontSize: '14px' }}>
                    <CheckCircle2 size={16} /> 실시간 인식 활성
                </div>
                <button onClick={() => setIsManualModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    <User size={16} /> 수동 이름 입력
                </button>
            </div>

            <AnimatePresence>
                {isManualModalOpen && (
                    <div className="modal-overlay" style={{ zIndex: 2000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h2>수동 출격 입력</h2>
                                <button onClick={() => setIsManualModalOpen(false)} style={{ color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <input autoFocus placeholder="학생 이름을 입력하세요..." value={manualSearch} onChange={handleManualSearch} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '10px', color: 'white', marginBottom: '15px' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {searchResults.map(s => (
                                    <button key={s.id} onClick={() => handleAttendance(s)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', cursor: 'pointer', width: '100%' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{s.classes?.name || '미배정'}</div>
                                        </div>
                                        <span style={{ color: '#6366f1', fontWeight: 600, alignSelf: 'center' }}>선택</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {scanResult && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 3000, width: '90%', maxWidth: '340px', padding: '40px', textAlign: 'center', borderRadius: '32px', background: 'rgba(15, 23, 42, 0.98)', border: '1px solid #10b981' }}>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white' }}>
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '8px' }}>{scanResult.name}</h2>
                        <div style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 600 }}>출석 확인되었습니다!</div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {scanError && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ position: 'fixed', bottom: '40px', padding: '16px 24px', background: '#ef4444', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000 }}>
                        <AlertCircle size={20} /> {scanError}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
                #reader__scan_region { border: none !important; }
                #reader__dashboard { display: none !important; }
            `}</style>
        </div>
    );
}
