## 🔐 Authentication & Protected Routes

### Ringkasan
Sistem authentication telah diimplementasikan dengan middleware Next.js dan hooks custom untuk melindungi halaman-halaman yang memerlukan login.

---

## 📋 Komponen Utama

### 1. **Middleware** (`middleware.ts`)
Berjalan di setiap request untuk verify token dan melakukan redirect otomatis.

**Rules:**
- ✅ Jika belum login → akses protected path → redirect ke `/login`
- ✅ Jika sudah login → akses `/login` → redirect ke `/dashboard`
- ✅ Jika belum login → akses `/` → redirect ke `/login`
- ✅ Jika sudah login → akses `/` → redirect ke `/dashboard`

**Protected Paths:**
- `/dashboard`
- `/stok-retail`
- `/transaksi`
- `/transaksi/histori`
- `/profile`

**Public Paths:**
- `/login`
- `/register`

---

### 2. **Auth Utilities** (`lib/auth.ts`)
Fungsi-fungsi helper untuk manajemen token.

```typescript
// Simpan token (localStorage + cookie)
setToken(token: string)

// Ambil token dari localStorage
getToken(): string | null

// Hapus token (localStorage + cookie)
removeToken(): void

// Cek apakah user sudah login
isAuthenticated(): boolean

// Parse JWT payload
parseJwt(token: string): any

// Cek apakah token sudah expired
isTokenExpired(token: string): boolean

// Ambil user data dari token
getUserFromToken(): any
```

---

### 3. **Custom Hooks** (`lib/hooks.ts`)

#### `useProtectedPage()`
Hook untuk melindungi halaman yang memerlukan login. Jika belum login, otomatis redirect ke `/login`.

**Usage:**
```tsx
export default function DashboardPage() {
  const { isReady, user } = useProtectedPage();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return <Dashboard />;
}
```

#### `useAuthStatus()`
Hook untuk monitoring login status realtime.

**Usage:**
```tsx
export default function UserMenu() {
  const { isAuthenticated, user, isLoading } = useAuthStatus();

  if (isLoading) return <Spinner />;
  
  if (isAuthenticated) {
    return <UserInfo user={user} />;
  }

  return <LoginLink />;
}
```

---

### 4. **Login Flow**
1. User masukkan username & password
2. Frontend kirim ke `/api/auth/login`
3. Backend return token JWT
4. Frontend simpan token: `setToken(token)` → localStorage + cookie
5. Middleware detect token ada → izinkan akses protected routes
6. User redirect ke `/dashboard`

---

### 5. **Logout Flow**
1. User click logout button
2. Frontend call `logout()`
3. Backend logout endpoint dijalankan
4. Token dihapus: `removeToken()` → localStorage + cookie
5. User redirect ke `/login`

---

### 6. **Protected Pages**
Semua halaman protected sudah dilengkapi dengan:
- ✅ Import `useProtectedPage` hook
- ✅ Destructure `const { isReady } = useProtectedPage()`
- ✅ Check `if (!isReady)` dan tampilkan loading screen
- ✅ Render content hanya jika `isReady === true`

**Pages yang sudah dilindungi:**
- `/dashboard`
- `/stok-retail`
- `/transaksi`
- `/transaksi/histori`

---

## 🔄 Token Management

### Storage
Token disimpan di dua tempat:
1. **localStorage** - Untuk akses dari JavaScript
2. **Cookie** - Untuk akses dari middleware & server

### Expiry
- Token diset dengan max-age 7 hari
- Saat akses, cek apakah token sudah expired dengan `isTokenExpired()`
- Jika expired, hapus dan redirect ke login

### Security
- Token tidak disimpan di global scope
- Gunakan localStorage.getItem("token") atau `getToken()`
- Cookie dihapus dengan max-age=0

---

## 🛡️ Best Practices

### ✅ DO
- Gunakan `setToken()` & `removeToken()` untuk manage token
- Gunakan `useProtectedPage()` di halaman yang perlu login
- Cek `isReady` sebelum render protected content
- Gunakan middleware untuk validasi request

### ❌ DON'T
- Jangan simpan token di global variable
- Jangan skip auth check di protected pages
- Jangan expose token di URL params
- Jangan share token antar users

---

## 📊 Auth Flow Diagram

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│ POST /api/auth/login         │
│ { username, password }       │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Backend verify credentials   │
│ Return: { token, user }      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Frontend: setToken(token)    │
│ - Save to localStorage       │
│ - Set cookie (7 days)        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Middleware detect token      │
│ Redirect to /dashboard       │
└──────────────────────────────┘
```

---

## 🚀 Implementasi Baru untuk Protected Routes

Jika menambah halaman baru yang memerlukan login:

```tsx
"use client";

import { useProtectedPage } from "@/lib/hooks";

export default function NewProtectedPage() {
  const { isReady, user } = useProtectedPage();

  // Loading state
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p>Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Render protected content
  return (
    <div>
      <h1>Protected Page - {user?.username}</h1>
      {/* ... content ... */}
    </div>
  );
}
```

Jangan lupa update `PROTECTED_PATHS` di `middleware.ts` jika menambah path baru!

---

## 🔍 Debug Tips

```typescript
// Cek token saat ini
const token = getToken();
console.log("Token:", token);

// Cek user data
const user = getUserFromToken();
console.log("User:", user);

// Cek apakah expired
const expired = isTokenExpired(token);
console.log("Token expired?", expired);

// Cek middleware logs
// Buka browser console → cek untuk "[MIDDLEWARE]" logs
```

---

## 📝 Checklist Implementasi

- ✅ Middleware updated dengan protected paths
- ✅ Auth utilities dibuat (lib/auth.ts)
- ✅ Custom hooks dibuat (lib/hooks.ts)
- ✅ Login page updated dengan setToken()
- ✅ Logout updated dengan removeToken()
- ✅ Dashboard protected
- ✅ Stok Retail protected
- ✅ Transaksi protected
- ✅ History Transaksi protected

---

## 🎯 Testing

### Test Login
1. Buka `http://kalako.local:3000/login`
2. Masukkan username & password
3. Seharusnya redirect ke `/dashboard`
4. Check browser console → lihat token di localStorage

### Test Protected Route
1. Hapus cookie token atau buka incognito
2. Coba akses `http://kalako.local:3000/dashboard`
3. Seharusnya redirect ke `/login`

### Test Logout
1. Login dulu
2. Click logout button
3. Seharusnya redirect ke `/login`
4. Check localStorage → token harus kosong

---

## 📚 References
- Next.js Middleware: https://nextjs.org/docs/advanced-features/middleware
- JWT Tokens: https://jwt.io
- Authentication Best Practices: https://owasp.org/www-community/attacks/jwt
