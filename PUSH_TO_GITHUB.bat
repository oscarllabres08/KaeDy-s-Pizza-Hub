@echo off
setlocal
cd /d "%~dp0"

echo [1/5] Git repo sa folder na ito...
if not exist ".git" (
  git init
  if errorlevel 1 goto :fail
)

echo [2/5] Remote origin (user repo)...
git remote remove origin 2>nul
git remote add origin "https://github.com/oscarllabres08/KaeDy-s-Pizza-Hub.git"
if errorlevel 1 goto :fail

echo [3/5] Stage files (.env at node_modules ay hindi kasama dahil sa .gitignore)...
git add -A
if errorlevel 1 goto :fail

echo [4/5] Commit...
git commit -m "Initial commit: KaeDy's Pizza Hub user website"
if errorlevel 1 (
  echo Walang bagong commit (baka empty o same na lahat). Tutuloy sa push...
)

echo [5/5] Push sa main...
git branch -M main 2>nul
git push -u origin main
if errorlevel 1 goto :fail

echo.
echo Tapos na ang push. Check: https://github.com/oscarllabres08/KaeDy-s-Pizza-Hub
pause
exit /b 0

:fail
echo.
echo May error. Siguraduhing naka-install ang Git, at naka-login ka (Git Credential Manager o Personal Access Token).
pause
exit /b 1
