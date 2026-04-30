# 1. Start with a lightweight Linux machine that has Node pre-installed
FROM node:18-bullseye-slim

# 2. Install FFmpeg, Python, and the C++ libraries OpenCV needs to run
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3. Create a working directory inside the container
WORKDIR /app

# 4. Copy your package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# 5. Install the Python dependencies (using headless OpenCV for servers!)
RUN pip3 install opencv-python-headless numpy

# 6. Copy the rest of your backend code (server.js, analyzer.py)
COPY . .

# 7. Expose the port your Express server uses
EXPOSE 3000

# 8. Start the engine
CMD ["node", "server.js"]