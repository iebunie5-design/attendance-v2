# 🎯 아이디어큐브 아름/SW코딩 출결 관리 시스템 v2.1 (Final)

아이디어큐브 아름/SW코딩 학원의 효율적인 학생 관리와 스마트한 출결 처리를 위해 개발된 전용 시스템입니다. 
Next.js 14와 Supabase를 결합하여 보안성, 실시간성, 그리고 관리자 편의성을 극대화하였습니다.

---

## 🌟 핵심 기능 요약

### 1. 🔐 관리자 보안 및 인증 (Admin Security)
*   **보안 로그인**: Supabase Auth 연동으로 허가된 관리자만 시스템에 접근 가능.
*   **비밀번호 관리**: [설정] 메뉴를 통한 실시간 관리자 비밀번호 변경 및 세션 유지.
*   **권한 제어**: 비로그인 사용자의 페이지 접근을 원천 차단하는 Auth Wrapper 구현.

### 2. 📱 스마트 출결 센터 (Kiosk Mode)
*   **QR 스캔 시스템**: 학생별 고유 QR 코드를 이용한 1초 출결 처리.
*   **수동 입력 동기화**: QR이 없는 학생도 이름 검색으로 즉시 출결 가능하며, 모든 데이터는 반 정보(`class_id`)와 연동되어 누락 없이 기록됨.
*   **사운드 및 시각 피드백**: 출결 성공 시 직관적인 알림음과 애니메이션 제공.

### 3. 🏫 통합 반/학생 관리 (Management)
*   **학생 수 자동 집계**: 반 관리에서 학생 수를 수동으로 입력할 필요 없이, DB 기반으로 실시간 자동 계산.
*   **딥링크(Deep Linking)**: 반 관리 목록의 '상세보기' 클릭 시 해당 반이 선택된 상태로 출결 페이지 자동 연결.
*   **QR 코드 발급**: 학생 등록 시 고유 QR 코드가 자동 생성되며 이미지로 저장 가능.

### 4. ⚙️ 지능형 설정 및 데이터 관리 (Settings)
*   **알림톡 템플릿**: `{name}`, `{time}` 변수를 활용하여 출석/하원 메시지 문구를 자유롭게 커스터마이징.
*   **데이터 백업(CSV)**: 등록된 전체 학생 명단을 엑셀(CSV) 파일로 즉시 추출하여 외부 문서 작업에 활용 가능.
*   **프로필 수정**: 학원 명칭, 원장님 정보 등 시스템 전반의 브랜딩 정보 관리.

### 5. 📊 통계 및 레포트 (Analytics)
*   **월간 출석부**: 인쇄에 최적화된 월간 출석 현황판 제공.
*   **주간 추이 및 순위**: 주간 출석률 변화 및 성실 학생 TOP 5 통계 시각화.

---

## 🛠 기술 스택 (Tech Stack)
- **Frontend**: Next.js 14 (App Router), React, Framer Motion
- **Backend/Database**: Supabase (PostgreSQL, Realtime, Auth)
- **Icons**: Lucide React
- **Scanning/QR**: html5-qrcode, qrcode.react

---

## 📂 프로젝트 주요 구조
- `src/app/attendance`: 일별/반별 정밀 출결 기록 및 토글 관리
- `src/app/classes`: 학급 정보 및 담당 강사 관리 (자동 집계 로직 포함)
- `src/app/students`: 학생 학적 관리 및 QR 코드 생성 센터
- `src/app/qr`: 키오스크 전용 QR/수동 입력 인터페이스
- `src/app/settings`: 시스템 메시지, 비번 변경, CSV 백업 등 관리자 도구
- `src/app/reports`: 각종 통계 및 인쇄용 보고서 생성

---

## 📝 시작 가이드

1. **환경 변수 설정** (`.env.local`)
   ```env
   NEXT_PUBLIC_SUPABASE_URL=설정_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=설정_API_KEY
   ```

2. **로컬 실행**
   ```bash
   npm install
   npm run dev
   ```

---

**아이디어큐브 아름/SW코딩 학원의 무궁한 발전을 기원합니다!** 😊🚀
