@echo off
chcp 65001 >nul
echo AgroMeta Github Yukleme Araci
echo ==========================================

set repoUrl=https://github.com/rifatsekerariot/agrotarim.git

if not exist .git (
    echo Git repository baslatiliyor...
    git init
    git branch -M main
)

echo.
echo Dosyalar ekleniyor...
git add .

echo.
echo Commit olusturuluyor...
set timestamp=%date% %time%
git commit -m "Auto-commit: %timestamp%"

echo.
echo Remote origin ayarlaniyor...
rem Eski remote varsa kaldir
git remote remove origin 2>nul
git remote add origin %repoUrl%

echo.
echo Github'a pushlaniyor...
git push -u origin main

echo.
if %errorlevel% neq 0 (
    echo HATA: Push islemi basarisiz oldu. Lutfen internet baglantinizi kontrol edin.
) else (
    echo Islem basariyla tamamlandi!
)

pause
