import express from 'express';
import cors from 'cors';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static'; 
import fs from 'fs'; 
import path from 'path'; 
import os from 'os';
import { exec } from 'child_process'; 

// 1. FREE THE BINARIES: Unpack FFmpeg from the read-only ASAR zip
let ffmpegPath = ffmpegStatic;
let ffprobePath = ffprobeStatic.path;
if (ffmpegPath.includes('app.asar')) {
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
    ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked');
}
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const app = express();
app.use(cors());
// Health Check Route (Fixes "Cannot GET /")
app.get('/', (req, res) => {
    res.json({ 
        system: "VibeAxis Labs // Forensics API", 
        status: "Online",
        environment: "Production Container"
    });
});
// 2. BYPASS PERMISSIONS: Use the OS Temp folder
const uploadDir = path.join(os.tmpdir(), 'vibeaxis-uploads');
const framesDir = path.join(uploadDir, 'frames');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

app.use('/frames', express.static(framesDir));
const upload = multer({ dest: uploadDir });

// Point directly to the Python script for the Linux container
const enginePath = path.join(process.cwd(), 'analyzer.py');

app.post('/api/analyze', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send("No video uploaded");

    ffmpeg.ffprobe(req.file.path, (err, metadata) => {
        if (err) return res.status(500).send("FFprobe Error");

        const duration = metadata.format.duration;
        fs.readdirSync(framesDir).forEach(f => fs.rmSync(path.join(framesDir, f)));

      ffmpeg(req.file.path)
            // -r 15 extracts 15 frames per second for the ENTIRE video
            .outputOptions(['-r 15', '-vf scale=640:-2'])
            .output(path.join(framesDir, 'frame-%03d.png'))
            .on('end', () => {
                
                // We are explicitly passing '5' here to trigger your Python Temporal Skip!
           exec(`python3 "${enginePath}" "${framesDir}" 5`, (error, stdout, stderr) => {
                    if (error) return res.status(500).send("Analysis Engine Failed");

                    try {
                        const pyResult = JSON.parse(stdout);
                        if (pyResult.error) return res.status(500).send(pyResult.error);

                        let worstFrameIndex = 0;
                        let highestSlop = -1;
                        pyResult.heatmap.forEach((score, idx) => {
                            if (score > highestSlop) {
                                highestSlop = score;
                                worstFrameIndex = idx;
                            }
                        });

                        const frameNum = String(worstFrameIndex + 1).padStart(3, '0');
                        const baseUrl = `${req.protocol}://${req.get('host')}`;
                        const worstFrameUrl = `${baseUrl}/frames/frame-${frameNum}.png`;

                        res.json({
                            message: "Forensic Scan Complete",
                            fileName: req.file.originalname,
                            durationSeconds: duration.toFixed(2),
                            framesExtracted: pyResult.heatmap.length,
                            overallConfidence: pyResult.confidence,
                            heatmap: pyResult.heatmap,
                            evidenceUrl: worstFrameUrl,
                            evidenceFrame: worstFrameIndex + 1,
                            evidenceScore: highestSlop
                        });
                        
                    } catch (parseErr) {
                        res.status(500).send("Engine Output Error");
                    } finally {
                        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
                    }
                });
            })
            .on('error', (err) => res.status(500).send("Frame Extraction Failed"))
            .run();
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Slop Analyzer API running on port ${PORT}`);
});