@echo off
rem Stops the Beginners Mandarin background server started by the launcher.
if exist "%~dp0run.pid" (
  set /p SRVPID=<"%~dp0run.pid"
  taskkill /PID %SRVPID% /F >nul 2>&1
  del "%~dp0run.pid" >nul 2>&1
  echo Beginners Mandarin stopped.
) else (
  echo Beginners Mandarin is not running ^(no run.pid found^).
)
pause
