---
title: AI Research
img: /assets/AI_pics.webp
img_alt: AI research project
description: |
  Exploring intelligent systems and computer vision through practical experiments — neural networks, real-time
  object detection, and ethical AI with data transparency.
---

## Coming in 2027

Our AI Research division is currently in development. We are working on exciting projects involving computer vision, machine learning, and edge computing.

Stay tuned for updates on our AI initiatives.

### Planned Focus Areas

- Neural networks and model training
- Real-time object detection
- Ethical AI and data transparency

### Face Recognition AI (Preview)

An applied computer-vision project focusing on lightweight face detection and recognition that can run in realtime on edge devices with privacy-preserving local inference.

**Model Pipeline & Deployment** — *Posted: 2024-11-02 · Tags: AI, Computer Vision, TFLite*

Pipeline: data collection → preprocessing → training (transfer learning) → quantization → on-device deployment. We used MobileNetV2 backbones retrained on a curated dataset, then applied post-training quantization to reduce model size.

**Description** — Compact face detection and recognition system intended to run on-device for privacy-preserving identification in small-scale deployments.

**Purpose** — Enable fast, private identity verification for lab demos and lightweight access control systems without cloud dependency.

**Technology** — MobileNet-based feature extractor, TensorFlow Lite quantization, OpenCV preprocessing.

**Evaluation:** Collected ~8k images with balanced poses; top-1 accuracy 92.1% on the held-out set.
