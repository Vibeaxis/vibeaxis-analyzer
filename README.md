Vibeaxis Temporal Analyzer
This is the open-source, local-first inspection engine built to detect AI-generated video artifacts, deepfakes, and diffusion "slop".

It scrubs video files entirely offline, tracking pixel-level temporal inconsistencies without requiring you to upload sensitive media to a closed-box cloud API.

This repository contains the offline core of the commercial engine running at vibeaxis.com.

How it Works (The Math)
Generative AI models struggle with object permanence. While individual frames might look photorealistic, the movement between frames often breaks the laws of physics.

This analyzer extracts consecutive frames and pushes them through a Dense Optical Flow engine (using Farneback's algorithm via OpenCV).

It maps the magnitude and direction of every moving pixel.

It plots those vectors onto a 36-bucket directional histogram.

The Verdict: If the vast majority of pixels agree on a trajectory (e.g., a real camera pan), the frame is coherent. If the vectors are scattering randomly in 360 degrees, the pixels are "boiling"—the undisputed hallmark of AI generation.

Tech Stack
To keep frame buffering fast and the UI responsive, the architecture is split:

Frontend (React / Vite): Handles the interactive heatmap timeline and UI state.

Backend (Python / OpenCV / Numpy): Crunches the dense vector math and generates the telemetry.

Deployment (Docker): Containerized for isolated, reproducible local execution.

Quick Start
1. Clone & Install Dependencies

Bash
git clone https://github.com/Vibeaxis/vibeaxis-analyzer.git
cd vibeaxis-analyzer

# Install frontend dependencies
npm install

# Install Python backend dependencies
pip install opencv-python numpy
2. Run the Stack
If you have Docker installed, simply run:

Bash
docker-compose up --build
Alternatively, you can run the Vite frontend (npm run dev) and the local Node/Python server (npm run server) manually.

The Full Engine
This is a lightweight, local-first extraction of our primary logic. For the fully managed, cloud-accelerated version featuring deeper Neural Network inspection and an expanded forensics suite, visit vibeaxis.com.
