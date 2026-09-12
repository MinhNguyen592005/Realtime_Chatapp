@echo off
title ChatApp Backend (Spring Boot)
echo Starting Spring Boot Backend...
cd /d "%~dp0backend"
mvn spring-boot:run
pause

