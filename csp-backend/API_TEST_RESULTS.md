# API Route Test Results

## Routes Available

### 1. POST `/sso-signup`
**Purpose:** Register a new user with Firebase authentication

**Request Body:**
```json
{
  "token": "firebase-id-token",
  "phoneNumber": "+1234567890"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "...",
    "phoneNumber": "+1234567890",
    "phoneExtension": "+91",
    "name": null,
    "email": null,
    "jwt": "custom-jwt-token"
  },
  "token": "custom-jwt-token"
}
```

**Response (Error):**
- `400` - Invalid input or user already exists
- `401` - Invalid Firebase token or phone number mismatch
- `500` - Server error (Firebase not configured)

---

### 2. POST `/sign-in`
**Purpose:** Sign in existing user with Firebase authentication

**Request Body:**
```json
{
  "token": "firebase-id-token"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "...",
    "phoneNumber": "+1234567890",
    "phoneExtension": "+91",
    "name": null,
    "email": null,
    "jwt": "custom-jwt-token"
  },
  "token": "custom-jwt-token"
}
```

**Response (Error):**
- `400` - Invalid input
- `401` - Invalid Firebase token or user not found
- `500` - Server error (Firebase not configured)

---

## Test Results

✅ **Routes are accessible** - Server is running on port 5000
✅ **Invalid routes return 404** - Error handling works
⚠️ **Authentication endpoints return 500** - Expected without Firebase credentials configured

## Next Steps to Test with Real Data

1. **Configure Firebase:**
   - Place `firebase-service-account.json` in `credentials/` folder
   - Or set `FIREBASE_SERVICE_ACCOUNT` environment variable

2. **Get Firebase ID Token:**
   - From your frontend app after Firebase authentication
   - This is the token that Firebase Auth generates

3. **Test with curl or Postman:**
   ```bash
   # SSO Signup
   curl -X POST http://localhost:5000/sso-signup \
     -H "Content-Type: application/json" \
     -d '{"token":"YOUR_FIREBASE_TOKEN","phoneNumber":"+1234567890"}'
   
   # Sign In
   curl -X POST http://localhost:5000/sign-in \
     -H "Content-Type: application/json" \
     -d '{"token":"YOUR_FIREBASE_TOKEN"}'
   ```

## Server Status

- ✅ Server starts successfully
- ✅ Routes are registered
- ✅ CORS is configured
- ✅ JSON body parsing works
- ⚠️ Firebase Admin needs credentials to verify tokens
