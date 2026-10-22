@echo off
REM Starts the Light's End alpha launcher (needs Node.js; Steam should be running for co-op).
cd /d "%~dp0"
npx electron .
