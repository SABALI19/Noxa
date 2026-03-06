Use this with [passwordResetRoutes.js](/c:/Users/SAMUEL/Documents/cloned%20repo/backend-snippets/passwordResetRoutes.js).

1. Add the route file to your backend and fix imports:
`User` model import
`sendEmail` (or your existing mailer)

2. Add fields to your user schema:
`passwordResetTokenHash: { type: String, default: null, select: false }`
`passwordResetExpiresAt: { type: Date, default: null, select: false }`

3. Mount routes in backend:
`app.use("/api/v1/users", passwordResetRoutes);`

4. Add backend env:
`APP_BASE_URL=http://localhost:5173`
`PASSWORD_RESET_TOKEN_TTL_MINUTES=30`

5. Confirm frontend env matches backend routes:
`VITE_AUTH_FORGOT_PASSWORD_PATH=/api/v1/users/forgot-password`
`VITE_AUTH_RESET_PASSWORD_PATH=/api/v1/users/reset-password`

6. Test flow:
Call `POST /api/v1/users/forgot-password` with `{ "email": "user@example.com" }`
Capture reset token/link (console in non-production)
Call `POST /api/v1/users/reset-password` with:
`{ "token": "...", "password": "newpassword", "confirmPassword": "newpassword" }`
