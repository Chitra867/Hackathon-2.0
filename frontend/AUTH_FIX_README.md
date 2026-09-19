# User Registration + Login Fix

## What changed

- Added `user` to the frontend `UserRole` type and removed `patient` as an account role.
- Registration sends both `password` and `password2`.
- Successful registration stores JWT tokens and logs the user in immediately.
- Normal users redirect to `/` after registration/login.
- Login accepts a username or email.
- Protected routes redirect normal users back to `/` instead of a healthcare worker portal.
- Normal users no longer see a meaningless Dashboard link.
- JWT refresh now saves a rotated refresh token, matching the backend SimpleJWT settings.

## Run

Because `node_modules` is platform-specific, install dependencies locally:

```bash
npm install
npm run dev
```

To type-check/build:

```bash
npm run build
```
