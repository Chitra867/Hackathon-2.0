# User Registration + Login Fix

This backend now supports normal public accounts with `role='user'`.

## What changed

- Added `user` as the default public role.
- Existing `patient` roles are migrated to `user` by migration `0003_normal_user_role`.
- Public registration always creates a normal `user` account.
- Registration validates `password` + `password2` and hashes the password with Django.
- Registration rejects duplicate email addresses case-insensitively.
- Login accepts either username or email in the `username` request field.
- Registration and login both return JWT `access`, `refresh`, and the full user profile.
- Profile responses now include `role_display`, `hospital_name`, and `is_active` to match the frontend.
- Added automated registration/login tests.

## Run after replacing the backend

```bash
python manage.py makemigrations --check
python manage.py migrate
python manage.py test apps.accounts.tests
python manage.py runserver
```

## PostgreSQL inspection

Your normal Django database configuration comes from `.env`. From the backend directory:

```bash
python manage.py dbshell
```

Inside `psql`:

```sql
\dt
SELECT id, username, email, role, is_active, is_verified, date_joined
FROM accounts_user
ORDER BY date_joined DESC;
\q
```

Do not expect plaintext passwords in the database. Django stores password hashes.
