# SentinelAI - Intelligent Human & System Cyber Defense Platform

## Production-Ready Authentication Component

This repository contains the complete React + Tailwind CSS v4 authentication page component for **SentinelAI**.

### Features

1. **Modern Dark SOC Visual Aesthetic**: Deep midnight slate (`#0a0f1d`) background with ambient radial glow and cyber grid pattern.
2. **Dual-Role Architecture**:
   - **Employee Portal**: Human Defense / PIS Layer with Cyan / Electric Blue accents (`#06b6d4` / `#3b82f6`).
   - **Admin Console**: System Guard & SOC Analytics with Crimson / Amber Red accents (`#ef4444` / `#f59e0b`).
3. **Form Fields & Validation**:
   - Corporate Email field with focus transitions and regex format validation.
   - Security Password field with show/hide password toggle.
   - Dynamic Multi-Factor (TOTP) token input for Admin clearance.
4. **Django REST Framework Integration**:
   - Interactive payload generator and inspector formatted for DRF Token authentication (`POST /api/v1/auth/token/`).

### How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server
npm run dev

# 3. Build for production
npm run build
```
