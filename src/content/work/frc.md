---
title: FIRST Robotics
img: /assets/FRC.JPG
img_alt: FRC competition robot
description: |
  JPL Innovation is under rookie team 10951, a competitive FRC team dedicated to engineering excellence, innovation,
  and STEM education. We design, build, and program competition robots while developing skills in mechanical
  engineering, programming, and project management.
---

## 🤖 FRC 2026 Season: Game Overview

This season's challenge centers on **precision game piece scoring**. Teams design and build robots capable of collecting and strategically scoring game pieces into designated alliance goals across multiple difficulty levels.

![2026 FRC Official Playing Field Layout](/assets/2026-playing-field-page.webp)

### Game Overview

**Competition Season:** January – April 2026

Two alliances, each consisting of three robots, compete head-to-head. The objective is to collect game pieces from the field and score them into alliance goals.

### Match Structure

Each match lasts **2 minutes 30 seconds** with three distinct phases:

1. **⚡ Autonomous Period (15 seconds)** — Robots operate using pre-programmed instructions only. Driver control disabled. Bonus points awarded for autonomous scoring.

2. **🎯 Teleoperated Period (2 minutes 15 seconds)** — Drivers control robots to score game pieces and execute tactical strategies.

3. **🏆 Endgame (final 30 seconds)** — Robots attempt climbing, docking, or parking for bonus points.

### Scoring Breakdown

| **Scoring Method** | **Points** | **Difficulty** |
|---|---|---|
| High Goal Scoring | 5-8 | Precision required |
| Low Goal Scoring | 2-3 | More accessible |
| Autonomous Bonus | +3 | Reliability-focused |
| Parking | 5 | Position-based |
| Low Climb | 10 | Mechanical challenge |
| High Climb | 20 | Elite teams only |

**Ranking Points:**
- **Win:** 2 RP | **Tie:** 1 RP | **Loss:** 0 RP
- **Bonus RP:** Awarded for completing advanced objectives

## Team 10951: FRC Team Overview

| **Attribute** | **Details** |
|---|---|
| **Team Number** | 10951 |
| **Organization** | Saigon South International School (SSIS) |
| **Rookie Year** | 2026 |
| **Region** | Asia-Pacific |
| **Mission** | Engineering excellence through competitive robotics |

### Team Focus
✅ **Mechanical Engineering** — CAD design, fabrication, mechanisms  
✅ **Control Systems** — Autonomous programming, real-time control  
✅ **Project Management** — Timeline coordination, resource allocation  
✅ **STEM Education** — Student mentorship and technical development

### 📅 2026 Season Timeline

**September – December 2025 · Preseason**
Team recruitment, skill workshops, prototyping exercises, competition preparation.

**January 4, 2026 · 🎬 Kickoff & Game Release**
Official game reveal. Analyzed manual, identified strategies, began design concepts.

**January 5 – 18, 2026 · 🎨 Design & Prototyping**
CAD modeling, mechanism prototyping, intake and shooter design validation.

**January 19 – February 8, 2026 · 🔧 Build Phase**
Full robot fabrication, electrical assembly, initial software development.

**February 12 – March 1, 2026 · ✅ Testing & Programming (CURRENT)**
Fine-tuning shooter (95% repeatability achieved), autonomous validation, competition prep.

**March 2 – 8, 2026 · 🇨🇦 Vancouver Regional**
First regional competition in Vancouver, Canada.

**March 30 – April 5, 2026 · 🇹🇷 Istanbul Regional**
Second regional competition in Istanbul, Turkey.

## ⚙️ Build Summary: Drivebase & Mechanisms

*Updated: 2026-02-18 · Status: ✅ Competition Ready*

### Design Philosophy
**Reliability First.** We prioritize consistent performance over peak capability. A robot that scores 80% reliably beats one that scores 95% once and fails the next.

### Technical Specifications

**Drivebase Architecture**
- 6-wheel traction layout with brushed gearboxes
- Staggered center wheel for precise control
- Encoder-based odometry with IMU sensor fusion
- ~140 lbs total mass (within competition limits)
- Top speed: 12 ft/s | Acceleration: 0-12 ft/s in 1.2s
- Pushing force: ~180 lbs (wheel friction limited)

**Power Systems**
- REV Robotics 40A PDP with integrated breakers
- 120A battery system with active balancing
- Pneumatic compressor for climbing mechanisms
- Distributed power to all subsystems

**Subsystems**
- **Intake:** Motorized dual-stage roller with game piece detection
- **Shooter:** Dual fly-wheel (adjustable 25°-65°) with hood positioning
- **Climb:** Pneumatic-actuated arms with passive ratchet
- **Software:** Java/WPILib, OpenCV vision, PathPlanner autonomous

### Performance Metrics

**Autonomous:**
- ✅ 95% repeatability over 50+ trials
- ✅ Average cycle time: 2.3 sec/game piece

**Shooting:**
- ✅ High goal: 78% accuracy (mid-field)
- ✅ Low goal: 92% accuracy
- ✅ Angle calibration: ±1° precision

---

## 🎯 Lessons Learned & Goals

### Key Achievements
- ✅ **Autonomous Mastery:** Developed reliable autonomous system with 95% consistency
- ✅ **Shooter Precision:** Achieved professional-grade accuracy in high-pressure testing
- ✅ **Team Synergy:** Built strong interdisciplinary collaboration between mechanical, electrical, and software teams
- ✅ **Timeline Management:** Maintained aggressive build schedule without compromising quality

### Areas for Improvement
- 📈 Increase high-goal accuracy to 85%+ under competition conditions
- 📈 Reduce game piece cycle time below 2.0 seconds
- 📈 Enhance pneumatic system reliability under sustained load
- 📈 Implement advanced vision processing for dynamic targeting

### Regional Competition Goals

🇨🇦 **Vancouver Regional (March 2-8)**
- Target: Top 16 finish in qualification matches
- Primary objective: Prove autonomous system reliability
- Focus: Build data for strategy refinement

🇹🇷 **Istanbul Regional (March 30 - April 5)**
- Target: Top 8 finish with playoff progression
- Primary objective: Consistent alliance scoring performance
- Focus: Scout strong partners for alliance selection

### Mentorship & Education
- Document all subsystems for next season's rookies
- Create CAD tutorials and build guides
- Conduct workshops on autonomous programming
- Establish standard operating procedures for maintenance

---

**Ready for competition.** See us in Vancouver and Istanbul! 🚀
