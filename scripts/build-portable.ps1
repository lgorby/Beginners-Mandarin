# Builds a portable Windows package of Beginners Mandarin into
# dist-portable\BeginnersMandarin\ (plus a zip next to it).
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File scripts\build-portable.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root "dist-portable\BeginnersMandarin"

Write-Host "== 1/5 Building Next.js (standalone) =="
Push-Location $root
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "next build failed" }
Pop-Location
if (-not (Test-Path "$root\.next\standalone\server.js")) {
  throw "Standalone output missing - check output:'standalone' in next.config.ts"
}

Write-Host "== 2/5 Laying out app files =="
if (Test-Path (Join-Path $root "dist-portable")) {
  Remove-Item -Recurse -Force (Join-Path $root "dist-portable")
}
New-Item -ItemType Directory -Force "$dist\app" | Out-Null
Copy-Item "$root\.next\standalone\*" "$dist\app" -Recurse -Force
New-Item -ItemType Directory -Force "$dist\app\.next\static" | Out-Null
Copy-Item "$root\.next\static\*" "$dist\app\.next\static" -Recurse -Force
if (Test-Path "$root\public") {
  Copy-Item "$root\public" "$dist\app\public" -Recurse -Force
}
# The dictionary file is read at runtime with fs, so bundle it explicitly.
New-Item -ItemType Directory -Force "$dist\app\data" | Out-Null
Copy-Item "$root\data\cedict_ts.u8" "$dist\app\data\" -Force

Write-Host "== 3/5 Bundling Node runtime =="
New-Item -ItemType Directory -Force "$dist\node" | Out-Null
Copy-Item (Get-Command node).Source "$dist\node\node.exe" -Force

Write-Host "== 4/5 Compiling launcher =="
$csc = Join-Path $env:windir "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (Test-Path $csc) {
  & $csc /nologo /target:winexe /reference:System.Windows.Forms.dll `
    /out:"$dist\BeginnersMandarin.exe" "$PSScriptRoot\Launcher.cs"
  if ($LASTEXITCODE -ne 0) { throw "csc failed" }
} else {
  Write-Warning "csc.exe not found - writing a .bat launcher instead."
  @"
@echo off
cd /d "%~dp0app"
set PORT=3210
set HOSTNAME=127.0.0.1
start "" http://127.0.0.1:3210
"%~dp0node\node.exe" server.js
"@ | Out-File "$dist\BeginnersMandarin.bat" -Encoding ascii
}
Copy-Item "$PSScriptRoot\Stop.bat" "$dist\Stop Beginners Mandarin.bat" -Force

Write-Host "== 5/5 README + zip =="
@"
Beginners Mandarin - portable edition
=====================================

To start:  double-click BeginnersMandarin.exe
           (the app opens at http://127.0.0.1:3210 in your default browser)
To stop:   double-click "Stop Beginners Mandarin.bat"

Notes
- Use Chrome or Edge as your default browser: the microphone speaking
  practice relies on their built-in Mandarin speech recognizer.
- Audio (text-to-speech) uses the Chinese voices built into Windows.
- Character stroke animations and the mic feature need an internet
  connection; lessons, dictionary, tones, and flashcards work offline.
- The whole folder is self-contained - copy it to a USB stick if you like.
  Keep BeginnersMandarin.exe inside this folder.
"@ | Out-File "$dist\README.txt" -Encoding utf8

$zip = Join-Path $root "dist-portable\BeginnersMandarin-portable.zip"
Compress-Archive -Path $dist -DestinationPath $zip -Force

$size = "{0:N0} MB" -f ((Get-ChildItem $dist -Recurse | Measure-Object Length -Sum).Sum / 1MB)
Write-Host ""
Write-Host "Done. Folder: $dist ($size)"
Write-Host "Zip:    $zip"
