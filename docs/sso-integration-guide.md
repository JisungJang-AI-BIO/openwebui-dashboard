# SSO Integration Guide: Knox Portal → Keycloak → Dashboard

## Current Architecture

```
Knox Portal (IdP)  ──SAML 2.0──→  Keycloak (SP/IdP)  ──OIDC 2.0──→  Open WebUI
                                                       ──OIDC 2.0──→  Dashboard (this project)
```

- **Knox Portal**: Samsung internal Identity Provider (SAML 2.0)
- **Keycloak**: Identity Broker / Service Provider. Receives SAML assertions from Knox Portal and converts them to OIDC tokens
- **Dashboard**: Authenticates using Keycloak as the OIDC Provider

## Development Environment (Mock Auth)

SSO cannot be tested in the local environment, so mock auth mode is used.

### How It Works

- Environment variable: `AUTH_MODE=mock`
- Frontend: User switching via `MockAuthBanner` component
- Backend: Extracts user ID (email prefix) from the `X-Auth-User` header
- Only `@samsung.com` emails are allowed

### Testing

```bash
# API call as a mock user
curl -H "X-Auth-User: jisung.jang" http://localhost:8005/api/packages

# Full email is also accepted (prefix is auto-extracted)
curl -H "X-Auth-User: jisung.jang@samsung.com" http://localhost:8005/api/auth/me
# → {"user": "jisung.jang", "is_admin": true}

# Non-Samsung emails are rejected
curl -H "X-Auth-User: user@gmail.com" http://localhost:8005/api/auth/me
# → 403 Forbidden
```

---

## Production SSO Transition Procedure

### Step 1: Register Dashboard Client in Keycloak

In the Keycloak Admin Console:

1. **Clients → Create Client**
   - Client ID: `sbiochat-dashboard`
   - Client Protocol: `openid-connect`
   - Root URL: `https://your-dashboard-domain.com`

2. **Client Settings**
   - Access Type: `confidential`
   - Valid Redirect URIs: `https://your-dashboard-domain.com/api/auth/callback`
   - Web Origins: `https://your-dashboard-domain.com`

3. **Credentials Tab**
   - Copy Client Secret → add to `.env`

4. **Mappers** (Optional)
   - Verify that the email claim is included in the token
   - Verify that the email attribute from Knox Portal is properly mapped

### Step 2: Configure Backend Environment Variables

Add to `.env`:

```env
AUTH_MODE=sso

# Keycloak OIDC Configuration
KEYCLOAK_URL=https://your-keycloak-domain.com
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=sbiochat-dashboard
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

Add environment variables to `docker-compose.yml`:

```yaml
backend:
  environment:
    - AUTH_MODE=${AUTH_MODE}
    - KEYCLOAK_URL=${KEYCLOAK_URL}
    - KEYCLOAK_REALM=${KEYCLOAK_REALM}
    - KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}
    - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
```

### Step 3: Implement OIDC Authentication in Backend

Add to `backend/requirements.txt`:

```
python-jose[cryptography]
httpx
```

Implement the SSO branch in `get_current_user()` in `backend/app/main.py`:

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
        # ... (existing mock code)
    else:
        # SSO mode: Validate Keycloak OIDC Bearer Token
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Bearer token required")

        token = auth_header.split(" ", 1)[1]
        try:
            # Decode Keycloak token (verified with public key)
            payload = jwt.decode(
                token,
                key=get_keycloak_public_key(),  # Fetched from JWKS
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

### Step 4: Frontend OIDC Login Flow

Choose one of two approaches:

#### Approach A: Backend-driven (Authorization Code Flow) — Recommended

Backend provides login/callback endpoints and maintains authentication via session cookies.

```
User → Dashboard → /api/auth/login → Keycloak login page
                                       → Knox Portal SSO
                                       → Authentication complete
       ← session cookie ← /api/auth/callback ← Keycloak redirect
```

Required backend endpoints:
- `GET /api/auth/login` → Redirect to Keycloak authorize URL
- `GET /api/auth/callback` → Exchange authorization code for token, create session
- `GET /api/auth/me` → Current user info (already implemented)
- `POST /api/auth/logout` → Delete session

Frontend changes:
- Remove `MockAuthBanner`
- Show login button when unauthenticated
- Use session cookies instead of `X-Auth-User` header (automatic)

#### Approach B: Frontend-driven (PKCE Flow)

Frontend communicates directly with Keycloak via OIDC. Uses the `oidc-client-ts` library.

```bash
npm install oidc-client-ts
```

### Step 5: Remove MockAuthBanner

When `AUTH_MODE=sso`:

1. Completely remove `MockAuthBanner` from conditional rendering
2. Update `RequirePackages` to get `currentUser` from the SSO session
3. Use session cookies or Bearer tokens instead of `X-Auth-User` header in API calls

---

## Working with Claude Code on Internal Environment

### Preparation

1. Dashboard Client registered in Keycloak Admin Console
2. Client Secret obtained
3. Keycloak settings added to `.env`

### Example Work Request for Claude Code

```
Implement Keycloak OIDC integration.
- KEYCLOAK_URL: https://keycloak.example.com
- REALM: samsung
- CLIENT_ID: sbiochat-dashboard
- CLIENT_SECRET: (provided separately)
- Change AUTH_MODE to sso and implement the SSO branch in get_current_user()
- Use Backend-driven Authorization Code Flow
- Render MockAuthBanner only when AUTH_MODE=mock
```

### Verification Steps

1. Set `AUTH_MODE=sso` and run `docker compose up --build`
2. Access Dashboard in browser → Verify redirect to Keycloak login page
3. Authenticate via Knox Portal SSO → Verify redirect back to Dashboard
4. Check `/api/auth/me` returns the correct email prefix
5. Verify package add/delete permissions

---

## Environment Variables Summary

| Variable | Development (mock) | Production (sso) |
|----------|-------------------|-------------------|
| `AUTH_MODE` | `mock` | `sso` |
| `ADMIN_USERS` | `jisung.jang` | `jisung.jang` |
| `KEYCLOAK_URL` | - | `https://keycloak.example.com` |
| `KEYCLOAK_REALM` | - | `samsung` |
| `KEYCLOAK_CLIENT_ID` | - | `sbiochat-dashboard` |
| `KEYCLOAK_CLIENT_SECRET` | - | `(secret)` |

## Note: Open WebUI Keycloak Integration

Since Open WebUI is already integrated with Keycloak via OIDC, you only need to add a Dashboard Client to the same Realm.
You can reference Open WebUI's environment variables to find the Keycloak URL, Realm, etc.
