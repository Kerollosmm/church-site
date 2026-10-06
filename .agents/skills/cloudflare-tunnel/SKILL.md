---
name: cloudflare-tunnel
description: Use when exposing local dev servers (localhost) to the public cloud via Cloudflare Quick Tunnels (trycloudflare.com) on Windows without login or configuration.
---

# Cloudflare Tunnel (Quick Tunnel)

## Overview
Expose local port to public internet via instant ephemeral Cloudflare Quick Tunnel (`*.trycloudflare.com`). Zero auth, zero config.

## When to Use
- Expose `localhost:3000` (or any local port) to internet for mobile/cloud testing, client demos, or webhook verification.
- Windows machine running dev server needing instant HTTPS URL.
- When NOT to use: Production static deployment (use Cloudflare Pages or Vercel instead).

## Requirements
- `cloudflared` binary on system PATH.
- If missing on Windows: `winget install --id Cloudflare.cloudflared`

## Quick Reference

| Action | Command (PowerShell) |
|---|---|
| Expose Port 3000 (Default) | `cloudflared tunnel --url http://localhost:3000` |
| Expose Custom Port (e.g. 8080) | `cloudflared tunnel --url http://localhost:8080` |
| Run in background & capture URL | `Start-Process cloudflared -ArgumentList "tunnel --url http://localhost:3000" -RedirectStandardError "tunnel.log" -NoNewWindow` |
| Extract public URL from log | `Get-Content tunnel.log | Select-String "trycloudflare.com"` |
| Stop all tunnels | `Stop-Process -Name cloudflared -Force` |

## One-Line Recipe

Run dev app in one shell, tunnel in another:
```powershell
# In project folder
pnpm dev:web

# Separate shell
cloudflared tunnel --url http://localhost:3000
```
Grab assigned `https://<random-words>.trycloudflare.com` printed in console. Done.

## Common Mistakes
- **Port mismatch**: Running tunnel on `3000` while app runs on `3001`. Fix: Check terminal port output first.
- **Firewall prompt**: Allow `cloudflared` through Windows Defender Firewall when prompted.
