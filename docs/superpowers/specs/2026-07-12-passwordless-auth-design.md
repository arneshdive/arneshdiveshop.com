# Passwordless Email + OTP Authentication

**Date:** 2026-07-12  
**Status:** Approved

## Overview

Remove password-based authentication entirely. Users sign up and log in using only their email and a one-time password (OTP) sent to their inbox.

## User Flows

### Login Flow

1. User enters email on auth page → clicks "Masuk"
2. System sends 6-digit OTP to email (valid 15 minutes)
3. User enters OTP → clicks "Verifikasi"
4. If OTP valid: session created, user redirected to account
5. If OTP invalid: error shown, can retry or resend

### Register Flow

1. User enters name + email → clicks "Daftar"
2. System creates unverified user account
3. System sends 6-digit OTP to email (valid 15 minutes)
4. User enters OTP → clicks "Verifikasi"
5. OTP verified: account marked verified, session created, user redirected

### Edge Cases

- **Email already registered but unverified:** Resend OTP, allow verification
- **Email already registered and verified:** Show "Email sudah terdaftar" error on register
- **User tries "login" with unregistered email:** Show same message (prevents enumeration)

## Changes

### 1. Frontend (`app/auth/page.tsx`)

**Remove:**
- `password` and `confirmPassword` from `AuthForm` state
- Password validation logic in `validateForm()`
- `forgot-password` mode
- `reset-password` mode
- Password input fields from login and register forms
- "Lupa password?" link
- `resetEmail`, `resetEmailSent` state variables

**Simplify:**
- Login: email input only → submit → OTP screen
- Register: name + email inputs → submit → OTP screen

### 2. Backend

No changes needed. Existing API routes already support passwordless flow:
- `POST /api/auth/login` — sends OTP to email
- `POST /api/auth/register` — creates user, sends OTP
- `POST /api/auth/verify-email` — verifies OTP, creates session
- `POST /api/auth/send-verification` — resends OTP

### 3. Cleanup

Delete `lib/auth/password.ts` — no longer used.

### 4. Database

No changes — `users` table already has no password column.

## Files Modified

| File | Action |
|------|--------|
| `app/auth/page.tsx` | Simplify to remove password fields and modes |
| `lib/auth/password.ts` | Delete |

## Security Considerations

- Rate limiting already implemented for OTP requests
- OTPs are one-time use (deleted after verification)
- OTP expiry (15 minutes) already enforced
- Email enumeration prevented (same response for existing/non-existing emails)
