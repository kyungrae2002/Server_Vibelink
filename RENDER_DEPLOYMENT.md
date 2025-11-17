# 🚀 Render 배포 가이드

이 문서는 VibeLink 서버를 Render에 배포하는 방법을 단계별로 안내합니다.

---

## 📋 사전 준비사항

1. **GitHub 계정** (코드 저장소)
2. **Render 계정** (https://render.com 회원가입)
3. **Spotify Developer 계정** (https://developer.spotify.com/dashboard)

---

## 1️⃣ GitHub 저장소 준비

### 1-1. 코드 커밋 및 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init

# .gitignore 확인 (.env 파일이 포함되어 있는지 확인)
cat .gitignore

# 변경사항 커밋
git add .
git commit -m "Ready for Render deployment"

# GitHub 저장소에 푸시
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### 1-2. .gitignore 확인

`.env` 파일이 절대 커밋되지 않도록 확인:

```gitignore
.env
.env.local
.env.production
node_modules/
logs/
*.log
```

---

## 2️⃣ Spotify Dashboard 설정

### 2-1. Spotify 앱 설정

1. **Spotify Dashboard 접속**: https://developer.spotify.com/dashboard
2. **앱 선택** 또는 **새 앱 생성**
3. **Settings** 클릭

### 2-2. Redirect URI 추가

**Edit Settings** → **Redirect URIs**에 다음 추가:

```
https://your-app-name.onrender.com/api/auth/callback
```

⚠️ **중요**:
- `your-app-name`은 다음 단계에서 Render에서 설정할 이름
- 반드시 `https://` 사용 (http 아님!)
- 경로는 정확히 `/api/auth/callback`

### 2-3. Client ID와 Secret 복사

- **Client ID** 복사
- **Show Client Secret** 클릭 후 **Client Secret** 복사
- 안전한 곳에 임시 저장 (다음 단계에서 사용)

---

## 3️⃣ Render에 배포하기

### 3-1. Render 대시보드 접속

1. https://dashboard.render.com 로그인
2. **New +** 버튼 클릭
3. **Web Service** 선택

### 3-2. GitHub 저장소 연결

1. **Connect a repository** 클릭
2. GitHub 계정 연결 (처음이면)
3. 배포할 저장소 선택

### 3-3. 서비스 설정

다음 정보 입력:

| 항목 | 값 |
|------|-----|
| **Name** | `vibelink-server` (원하는 이름) |
| **Region** | `Singapore` (한국과 가장 가까움) 또는 `Oregon` |
| **Branch** | `main` |
| **Root Directory** | (비워둠) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` (또는 유료 플랜) |

### 3-4. 환경 변수 설정

**Environment Variables** 섹션에서 **Add Environment Variable** 클릭:

#### 필수 환경 변수:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `SPOTIFY_CLIENT_ID` | (Spotify Dashboard에서 복사한 Client ID) |
| `SPOTIFY_CLIENT_SECRET` | (Spotify Dashboard에서 복사한 Client Secret) |
| `SPOTIFY_REDIRECT_URI` | `https://your-app-name.onrender.com/api/auth/callback` |
| `SESSION_SECRET` | **Generate** 버튼 클릭 (자동 생성) 또는 64자 랜덤 문자열 |
| `ALLOWED_ORIGINS` | 프론트엔드 URL (예: `https://your-frontend.vercel.app`) |

**SESSION_SECRET 생성 방법:**
```bash
# 터미널에서 실행
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3-5. 배포 시작

1. **Create Web Service** 버튼 클릭
2. 배포 시작 (3-5분 소요)
3. 로그에서 빌드 진행상황 확인

---

## 4️⃣ 배포 완료 후 확인

### 4-1. 서비스 URL 확인

배포가 완료되면 다음 URL이 생성됩니다:
```
https://your-app-name.onrender.com
```

### 4-2. Health Check

브라우저에서 접속:
```
https://your-app-name.onrender.com/health
```

응답:
```json
{
  "status": "ok",
  "message": "VibeLink Server is running"
}
```

### 4-3. API 문서 확인

```
https://your-app-name.onrender.com/api-docs
```

### 4-4. Spotify 로그인 테스트

```
https://your-app-name.onrender.com/api/auth/login
```

---

## 5️⃣ Spotify Redirect URI 최종 확인

1. **Spotify Dashboard** 재확인
2. **Redirect URIs**에 다음이 정확히 입력되었는지 확인:
   ```
   https://your-app-name.onrender.com/api/auth/callback
   ```
3. **Save** 클릭

---

## 🔄 업데이트 배포하기

코드 수정 후 배포:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render가 자동으로 새 버전 배포!

---

## 🐛 문제 해결

### 1. "Application error" 발생

**원인**: 환경 변수 누락 또는 오류

**해결**:
1. Render 대시보드 → **Environment** 탭
2. 모든 환경 변수 확인
3. 특히 `SESSION_SECRET`, `SPOTIFY_CLIENT_ID` 확인

### 2. Spotify 로그인 후 "redirect_uri_mismatch" 오류

**원인**: Spotify Dashboard의 Redirect URI 불일치

**해결**:
1. Spotify Dashboard 확인
2. Redirect URI가 정확한지 확인:
   ```
   https://your-app-name.onrender.com/api/auth/callback
   ```
3. `http://` 아닌 `https://` 사용 확인

### 3. CORS 오류

**원인**: `ALLOWED_ORIGINS`에 프론트엔드 URL이 없음

**해결**:
1. Render → **Environment** → `ALLOWED_ORIGINS` 확인
2. 프론트엔드 URL 추가:
   ```
   https://your-frontend.vercel.app,https://your-frontend.netlify.app
   ```

### 4. 로그 확인

Render 대시보드 → **Logs** 탭에서 실시간 로그 확인

---

## 📊 Free Tier 제한사항

Render Free Plan:
- ✅ 무료 SSL 인증서
- ✅ 자동 배포
- ⚠️ 15분 비활성 시 sleep 모드 (첫 요청 시 10-30초 소요)
- ⚠️ 월 750시간 무료 (1개 서비스 상시 운영 가능)

**Sleep 모드 해결책:**
- Uptime 모니터링 서비스 사용 (UptimeRobot 등)
- 또는 유료 플랜 업그레이드 ($7/월)

---

## 🎯 체크리스트

배포 전 확인:

- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] GitHub에 코드 푸시 완료
- [ ] Spotify Dashboard에 Redirect URI 추가
- [ ] Render에 모든 환경 변수 설정
- [ ] `NODE_ENV=production` 설정
- [ ] 배포 후 `/health` 엔드포인트 테스트
- [ ] Spotify 로그인 테스트

---

## 🆘 추가 도움말

**Render 공식 문서**: https://render.com/docs

**문제 발생 시**:
1. Render 로그 확인
2. 환경 변수 재확인
3. Spotify Dashboard 설정 확인

배포 성공하세요! 🎉
