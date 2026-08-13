@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies...
  call pnpm install
  if errorlevel 1 exit /b 1
)

if not exist "dist\index.js" (
  echo Building Sky ERP...
  call pnpm run build
  if errorlevel 1 exit /b 1
)

set HOST=0.0.0.0
set PORT=3000
set NODE_ENV=production

echo Sky ERP LAN server is starting.
echo On this computer open: http://localhost:3000/
echo On other computers open: http://SERVER-LAN-IP:3000/
echo Keep this window open while the server is in use.
call pnpm run start:lan
