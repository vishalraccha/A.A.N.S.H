@echo off
REM === Git Auto Commit & Push Script ===
cd /d "D:\PROJECTS\FINAL YEAR\A.A.N.S.H"

git add .
git commit -m "Daily update - %date% %time%"
git push origin main
