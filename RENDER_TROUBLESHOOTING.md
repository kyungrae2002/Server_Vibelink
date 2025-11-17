# 🔧 Render 배포 문제 해결 가이드

## ❌ State Mismatch 오류

### 증상
```json
{
  "error": "State mismatch"
}
```

Spotify 로그인 후 콜백 URL로 돌아올 때 발생하는 오류입니다.

### 원인

1. **세션이 저장되지 않음** - MemoryStore는 서버 재시작/슬립 시 데이터 손실
2. **프록시 설정 누락** - Render는 리버스 프록시를 사용하는데 Express가 이를 인식하지 못함
3. **쿠키가 전송되지 않음** - HTTPS 환경에서 쿠키 설정 문제

### ✅ 해결 방법 (이미 적용됨)

다음 수정사항이 코드에 적용되었습니다:

#### 1. Trust Proxy 설정
```javascript
// src/index.js
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

#### 2. 세션 설정 개선
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax', // OAuth 플로우를 위해 'lax' 사용
    path: '/',
  },
  proxy: true // 프로덕션에서 프록시 신뢰
}));
```

#### 3. 세션 강제 저장
```javascript
// src/routes/auth.js - /login 엔드포인트
req.session.save((err) => {
  if (err) {
    console.error('Session save error:', err);
    return res.status(500).json({ error: 'Failed to initialize session' });
  }
  // Spotify로 리다이렉트
  res.redirect(authUrl);
});
```

### 🚀 재배포하기

수정사항을 적용하려면:

```bash
git add .
git commit -m "Fix state mismatch error for Render deployment"
git push origin main
```

Render가 자동으로 재배포합니다 (2-3분 소요).

---

## 📊 디버깅 로그 확인

Render 대시보드에서 로그를 확인하세요:

1. **Render Dashboard** → **your-service** → **Logs**
2. 로그인 시도 시 다음과 같은 로그 확인:

```
Session saved with state: abc123...
=== OAuth Callback Debug ===
Received state: abc123...
Stored state: abc123...
```

만약 `Stored state: null`이 나오면 세션이 저장되지 않은 것입니다.

---

## 🔐 환경 변수 재확인

Render 대시보드 → **Environment**에서 다음 확인:

### 필수 환경 변수:
- ✅ `NODE_ENV=production`
- ✅ `SESSION_SECRET` (64자 이상의 랜덤 문자열)
- ✅ `SPOTIFY_CLIENT_ID`
- ✅ `SPOTIFY_CLIENT_SECRET`
- ✅ `SPOTIFY_REDIRECT_URI=https://your-app.onrender.com/api/auth/callback`
- ✅ `ALLOWED_ORIGINS` (프론트엔드 URL)

### SESSION_SECRET 재생성 (권장)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

생성된 값을 Render의 `SESSION_SECRET`에 입력하고 **Save Changes** 클릭.

---

## 🌐 Spotify Dashboard 확인

https://developer.spotify.com/dashboard

1. **앱 선택** → **Settings**
2. **Redirect URIs** 확인:
   ```
   https://your-app-name.onrender.com/api/auth/callback
   ```
3. **정확히 일치하는지 확인** (끝에 슬래시 없음!)
4. `http://`가 아닌 `https://` 사용 확인

---

## 🧪 테스트 방법

### 1. Health Check
```bash
curl https://your-app.onrender.com/health
```

예상 응답:
```json
{"status":"ok","message":"VibeLink Server is running"}
```

### 2. 로그인 테스트
브라우저에서:
```
https://your-app.onrender.com/api/auth/login
```

### 3. 쿠키 확인
브라우저 개발자도구 → Application → Cookies → `https://your-app.onrender.com`

`vibelink.sid` 쿠키가 있어야 합니다.

---

## 🔄 여전히 State Mismatch가 발생하는 경우

### 임시 해결책: Redis 세션 저장소 사용

MemoryStore 대신 Redis를 사용하면 세션이 안정적으로 저장됩니다.

#### 1. Render에 Redis 추가

1. Render Dashboard → **New +** → **Redis**
2. **Free** 플랜 선택
3. 생성 완료 후 **Internal Redis URL** 복사

#### 2. 패키지 설치

package.json에 추가:
```json
{
  "dependencies": {
    "connect-redis": "^7.1.0",
    "redis": "^4.6.0"
  }
}
```

#### 3. 코드 수정

src/index.js:
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

// Redis 클라이언트 설정 (프로덕션에서만)
let sessionStore;
if (process.env.REDIS_URL) {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
    legacyMode: false
  });

  redisClient.connect().catch(console.error);

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  sessionStore = new RedisStore({
    client: redisClient,
    prefix: 'vibelink:'
  });
}

app.use(session({
  store: sessionStore, // Redis 또는 MemoryStore
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/'
  },
  proxy: true
}));
```

#### 4. Render 환경 변수 추가

```
REDIS_URL=redis://redis-xxxx.render.com:6379
```

#### 5. 재배포

```bash
git add .
git commit -m "Add Redis session store"
git push origin main
```

---

## 🐛 기타 일반적인 오류

### CORS 오류
```
Access to fetch blocked by CORS policy
```

**해결**: `ALLOWED_ORIGINS` 환경 변수에 프론트엔드 URL 추가
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.netlify.app
```

### 401 Unauthorized
```json
{"error": "Unauthorized", "message": "No access token provided"}
```

**해결**:
1. 먼저 `/api/auth/login`으로 로그인
2. 쿠키가 프론트엔드로 전송되는지 확인 (`credentials: 'include'`)

### 500 Internal Server Error

**확인**:
1. Render 로그 확인
2. 환경 변수가 모두 설정되었는지 확인
3. `SESSION_SECRET`이 32자 이상인지 확인

---

## 📞 추가 도움

문제가 계속되면:

1. **Render 로그 전체 복사**
2. **브라우저 개발자도구 네트워크 탭** 스크린샷
3. **환경 변수 설정** 확인 (비밀 정보는 가리기)

배포 성공하세요! 🎉
