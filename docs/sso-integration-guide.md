# SSO Integration Guide: Knox Portal → Keycloak → Dashboard

## 현재 아키텍처

```
Knox Portal (IdP)  ──SAML 2.0──→  Keycloak (SP/IdP)  ──OIDC 2.0──→  Open WebUI
                                                       ──OIDC 2.0──→  Dashboard (이 프로젝트)
```

- **Knox Portal**: Samsung 사내 Identity Provider (SAML 2.0)
- **Keycloak**: Identity Broker / Service Provider. Knox Portal로부터 SAML assertion을 받아 OIDC token으로 변환
- **Dashboard**: Keycloak을 OIDC Provider로 사용하여 인증

## 개발 환경 (Mock Auth)

현재 로컬 환경에서는 SSO를 테스트할 수 없으므로 mock auth 모드를 사용합니다.

### 작동 방식
- 환경변수: `AUTH_MODE=mock`
- Frontend: `MockAuthBanner` 컴포넌트로 사용자 전환 가능
- Backend: `X-Auth-User` 헤더에서 사용자 ID (email prefix) 추출
- `@samsung.com` 이메일만 허용

### 테스트 방법
```bash
# Mock 사용자로 API 호출
curl -H "X-Auth-User: jisung.jang" http://localhost:8005/api/packages

# Full email도 가능 (prefix 자동 추출)
curl -H "X-Auth-User: jisung.jang@samsung.com" http://localhost:8005/api/auth/me
# → {"user": "jisung.jang", "is_admin": true}

# Samsung 외 이메일은 거부됨
curl -H "X-Auth-User: user@gmail.com" http://localhost:8005/api/auth/me
# → 403 Forbidden
```

---

## Production SSO 전환 절차

### Step 1: Keycloak에 Dashboard Client 등록

Keycloak Admin Console에서:

1. **Clients → Create Client**
   - Client ID: `sbiochat-dashboard`
   - Client Protocol: `openid-connect`
   - Root URL: `https://your-dashboard-domain.com`

2. **Client Settings**
   - Access Type: `confidential`
   - Valid Redirect URIs: `https://your-dashboard-domain.com/api/auth/callback`
   - Web Origins: `https://your-dashboard-domain.com`

3. **Credentials 탭**
   - Client Secret 복사 → `.env`에 추가

4. **Mappers** (Optional)
   - email 클레임이 토큰에 포함되는지 확인
   - Knox Portal에서 전달받은 email attribute가 매핑되는지 확인

### Step 2: Backend 환경변수 설정

`.env` 파일에 추가:
```env
AUTH_MODE=sso

# Keycloak OIDC Configuration
KEYCLOAK_URL=https://your-keycloak-domain.com
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=sbiochat-dashboard
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

`docker-compose.yml`에 환경변수 추가:
```yaml
backend:
  environment:
    - AUTH_MODE=${AUTH_MODE}
    - KEYCLOAK_URL=${KEYCLOAK_URL}
    - KEYCLOAK_REALM=${KEYCLOAK_REALM}
    - KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}
    - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
```

### Step 3: Backend에 OIDC 인증 구현

`backend/requirements.txt`에 추가:
```
python-jose[cryptography]
httpx
```

`backend/app/main.py`의 `get_current_user()` 함수에서 SSO 분기 구현:

```python
from jose import jwt, JWTError
import httpx

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "")

# Keycloak public key cache
_jwks_cache = None

async def get_keycloak_public_keys():
    global _jwks_cache
    if _jwks_cache is None:
        url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            _jwks_cache = resp.json()
    return _jwks_cache

def get_current_user(request: Request) -> str:
    if AUTH_MODE == "mock":
        # ... (기존 mock 코드)
    else:
        # SSO mode: Keycloak OIDC Bearer Token 검증
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Bearer token required")

        token = auth_header.split(" ", 1)[1]
        try:
            # Keycloak 토큰 디코딩 (public key로 검증)
            payload = jwt.decode(
                token,
                key=get_keycloak_public_key(),  # JWKS에서 가져옴
                algorithms=["RS256"],
                audience=KEYCLOAK_CLIENT_ID,
            )
            email = payload.get("email", "")
            if not email or not email.endswith("@samsung.com"):
                raise HTTPException(status_code=403, detail="Only @samsung.com allowed")
            return email.split("@")[0]
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

### Step 4: Frontend OIDC 로그인 플로우

두 가지 방식 중 선택:

#### 방식 A: Backend-driven (Authorization Code Flow) - 권장
Backend가 로그인/콜백 엔드포인트를 제공하고, session cookie로 인증 유지.

```
사용자 → Dashboard → /api/auth/login → Keycloak 로그인 페이지
                                         → Knox Portal SSO
                                         → 인증 완료
         ← session cookie ← /api/auth/callback ← Keycloak redirect
```

필요한 Backend 엔드포인트:
- `GET /api/auth/login` → Keycloak authorize URL로 redirect
- `GET /api/auth/callback` → authorization code를 token으로 교환, session 생성
- `GET /api/auth/me` → 현재 사용자 정보 (이미 구현됨)
- `POST /api/auth/logout` → session 삭제

Frontend 변경:
- `MockAuthBanner` 제거
- 미인증 시 로그인 버튼 표시
- `X-Auth-User` 헤더 대신 session cookie 사용 (자동)

#### 방식 B: Frontend-driven (PKCE Flow)
Frontend에서 직접 Keycloak과 OIDC 통신. `oidc-client-ts` 라이브러리 사용.

```bash
npm install oidc-client-ts
```

### Step 5: MockAuthBanner 제거

`AUTH_MODE=sso`일 때:
1. `MockAuthBanner` 컴포넌트를 조건부 렌더링에서 완전히 제거
2. `RequirePackages`의 `currentUser`를 SSO 세션에서 가져오도록 변경
3. API 호출 시 `X-Auth-User` 헤더 대신 session cookie 또는 Bearer token 사용

---

## Claude Code로 사내 환경에서 작업할 때

### 사전 준비
1. Keycloak Admin Console에 Dashboard Client 등록 완료
2. Client Secret 확보
3. `.env`에 Keycloak 설정 추가

### Claude Code 작업 요청 예시
```
Keycloak OIDC 연동해줘.
- KEYCLOAK_URL: https://keycloak.example.com
- REALM: samsung
- CLIENT_ID: sbiochat-dashboard
- CLIENT_SECRET: (별도 전달)
- AUTH_MODE를 sso로 변경하고 get_current_user()의 SSO 분기 구현해줘
- Backend-driven Authorization Code Flow로 구현
- MockAuthBanner는 AUTH_MODE=mock일 때만 렌더링되게 해줘
```

### 검증 순서
1. `AUTH_MODE=sso`로 설정 후 `docker compose up --build`
2. 브라우저에서 Dashboard 접속 → Keycloak 로그인 페이지로 redirect 확인
3. Knox Portal SSO 인증 → Dashboard로 돌아오는지 확인
4. `/api/auth/me`로 email prefix 정상 반환 확인
5. Package 추가/삭제 권한 확인

---

## 환경변수 요약

| 변수 | 개발 (mock) | 운영 (sso) |
|------|-------------|------------|
| `AUTH_MODE` | `mock` | `sso` |
| `ADMIN_USERS` | `jisung.jang` | `jisung.jang` |
| `KEYCLOAK_URL` | - | `https://keycloak.example.com` |
| `KEYCLOAK_REALM` | - | `samsung` |
| `KEYCLOAK_CLIENT_ID` | - | `sbiochat-dashboard` |
| `KEYCLOAK_CLIENT_SECRET` | - | `(secret)` |

## 참고: OpenWebUI의 Keycloak 연동 설정

OpenWebUI가 이미 Keycloak과 OIDC로 연동되어 있으므로, 동일한 Realm에 Dashboard Client만 추가하면 됩니다.
OpenWebUI의 환경변수를 참고하여 Keycloak URL, Realm 등을 확인할 수 있습니다.
