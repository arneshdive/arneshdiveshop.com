# Passwordless Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove password fields and flows from the auth page, leaving only email + OTP authentication.

**Architecture:** Frontend simplification — remove password inputs, validation, and forgot/reset password modes. Delete unused password utility file.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `app/auth/page.tsx` | Modify | Remove password fields, simplify modes |
| `lib/auth/password.ts` | Delete | No longer needed |

---

## Task 1: Simplify Auth Page State and Types

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Remove password-related state and types**

Remove `password`, `confirmPassword` from `AuthForm` interface and state. Remove `forgot-password` and `reset-password` from `Mode` type. Remove `resetEmail` and `_resetEmailSent` state variables.

```typescript
type Mode = 'login' | 'register' | 'verify-email';

interface AuthForm {
  email: string;
  name: string;
  otp: string;
}

// In the component, remove:
// - password: '',
// - confirmPassword: '',
// - const [_resetEmailSent, setResetEmailSent] = useState(false);
// - const [resetEmail, setResetEmail] = useState('');
```

---

## Task 2: Simplify Form Validation

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Remove password validation from validateForm()**

Remove all password and confirmPassword validation logic from `validateForm()` function.

```typescript
const validateForm = (): boolean => {
  const newErrors: FormErrors = {};

  if (!form.email.trim()) {
    newErrors.email = 'Email wajib diisi';
  } else if (!isValidEmail(form.email)) {
    newErrors.email = 'Format email tidak valid';
  }

  if (mode === 'register') {
    if (!form.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }
  }

  if (mode === 'verify-email') {
    if (!form.otp.trim()) {
      newErrors.otp = 'Kode OTP wajib diisi';
    } else if (form.otp.length !== 6) {
      newErrors.otp = 'Kode OTP harus 6 digit';
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## Task 3: Simplify handleSubmit for Passwordless Flow

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Update login/register request logic**

Remove password from request body. Simplify to just send email (login) or name + email (register).

```typescript
if (mode === 'login' || mode === 'register') {
  const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const body = mode === 'login'
    ? { email: form.email }
    : { email: form.email, name: form.name };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
```

- [ ] **Step 2: Remove forgot-password and reset-password handlers**

Delete the entire `else if (mode === 'forgot-password')` and `else if (mode === 'reset-password')` blocks from handleSubmit. Keep only login, register, and verify-email flows.

- [ ] **Step 3: Simplify login/register success handling**

After login/register success, always go to verify-email mode:

```typescript
// After login or register success
setVerifyEmail(form.email.toLowerCase());
setOtpExpires(data.expires || 15);
setMode('verify-email');
setForm((prev) => ({ ...prev, otp: '' }));
```

---

## Task 4: Remove Forgot-Password and Reset-Password Form UI

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Delete forgot-password form JSX**

Remove the entire `if (mode === 'forgot-password')` JSX block (the form with "Lupa Password" header).

- [ ] **Step 2: Delete reset-password form JSX**

Remove the entire `if (mode === 'reset-password')` JSX block.

- [ ] **Step 3: Remove forgot password link from login form**

Remove the "Lupa password? Reset password" link from the login/register form section:

```typescript
// DELETE this block:
{mode === 'login' && (
  <p className="text-xs text-center text-neutral-400 mt-4">
    Lupa password?{' '}
    <button
      onClick={() => setMode('forgot-password')}
      className="text-neutral-600 hover:text-neutral-900 underline"
    >
      Reset password
    </button>
  </p>
)}
```

---

## Task 5: Remove Password Input Fields from Forms

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Remove password input from login/register form**

Delete both password and confirmPassword input fields. The form should now only show:
- Login: email only
- Register: name + email only

Remove these JSX sections:
- Password input div
- Confirm Password input div (register only)

---

## Task 6: Update FormErrors Interface

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Remove password-related error fields**

```typescript
interface FormErrors {
  email?: string;
  name?: string;
  otp?: string;
  general?: string;
}
```

---

## Task 7: Remove handleBackToLogin Function (Replace with Simpler Version)

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Simplify handleBackToLogin**

Keep a simple back handler for verify-email mode:

```typescript
const handleBackToLogin = () => {
  setMode('login');
  setErrors({});
  setForm({ email: '', name: '', otp: '' });
};
```

---

## Task 8: Clean Up Imports and Unused Variables

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Remove unused state variable**

Delete `const [resetEmail, setResetEmail] = useState('');` and `const [_resetEmailSent, setResetEmailSent] = useState(false);` if still present.

- [ ] **Step 2: Remove unused otpExpires state reference**

Keep `otpExpires` state for displaying expiry time on verify-email screen.

---

## Task 9: Delete Unused Password Utility File

**Files:**
- Delete: `lib/auth/password.ts`

- [ ] **Step 1: Delete the file**

```bash
rm lib/auth/password.ts
```

- [ ] **Step 2: Verify no imports of password.ts exist**

```bash
grep -r "from '@/lib/auth/password'" --include="*.ts" --include="*.tsx" .
```

Expected: No matches found

---

## Task 10: Commit Changes

- [ ] **Step 1: Stage and commit all changes**

```bash
git add app/auth/page.tsx lib/auth/password.ts
git commit -m "feat: remove password auth, simplify to email + OTP only

- Remove password and confirmPassword fields from auth form
- Remove forgot-password and reset-password flows
- Delete unused lib/auth/password.ts
- Simplify login to: email -> OTP
- Simplify register to: name + email -> OTP"
```

---

## Verification

After all tasks complete:

1. **Manual test login flow:**
   - Go to `/auth`
   - Enter email → submit → should show OTP screen
   - Enter OTP → should log in

2. **Manual test register flow:**
   - Go to `/auth` → click "Daftar"
   - Enter name + email → submit → should show OTP screen
   - Enter OTP → should verify and log in

3. **Verify no password references:**
   ```bash
   grep -ri "password" app/auth/page.tsx
   ```
   Expected: No matches (or only in comments if any)
