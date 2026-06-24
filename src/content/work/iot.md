---
title: Drone & Arduino
img: /assets/IOT2.jpg
img_alt: IoT and drone project
description: |
  Connecting the physical world with sensors, microcontrollers, and data systems — Arduino and Raspberry Pi
  integration, smart home automation, and data visualization dashboards.
---

## Coming After FRC Season

Our Drone & Arduino projects are currently on hold while we focus on the 2026 FRC competition season. We will resume development on embedded flight control and IoT projects after April 2026.

**Focus areas:** Flight Control · Arduino · Drone Building · IoT Sensors

### Flight Controller Design and Testing (Preview)

*Posted: 2025-05-10 · Tags: Embedded, PID, Flight Control*

Embedded flight-control projects centered on IMU fusion, real-time PID control and safe test practices for small multicopters and custom autopilot firmware.

We developed a lightweight flight stack running on an STM32 microcontroller. Key features include a complementary filter for attitude estimation, a cascaded PID controller, and a simple failsafe state machine for low battery and signal loss.

**Description** — A compact autopilot and sensor fusion stack for testing control loops on small multicopters and educational platforms.

**Purpose** — Validate control algorithms in real flight conditions and provide a reproducible platform for student experimentation.

**Technology** — STM32 microcontrollers, MPU-9250 IMU, MAVLink telemetry and ESCs.

**Tuning & results:** Systematic PID sweeps and logging produced stable hover within ±0.3m altitude and sub-degree attitude RMS during steady-state tests.
