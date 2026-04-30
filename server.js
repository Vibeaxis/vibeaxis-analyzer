import express from 'express';
import cors from 'cors';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static'; 
import fs from 'fs'; 
import path from 'path'; 
import { exec } from 'child_process'; 

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const app = express();
app.use(cors());

const uploadDir = path.join(process.cwd(), 'uploads');
const framesDir = path.join(uploadDir, 'frames');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

// CRITICAL NEW LINE: Expose the frames folder to the internet/browser
app.use('/frames', express.static(framesDir));

const upload = multer({ dest: uploadDir });

app.post('/api/analyze', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send("No video uploaded");

    console.log(`[SERVER] Received: ${req.file.originalname}`);

    ffmpeg.ffprobe(req.file.path, (err, metadata) => {
        if (err) return res.status(500).send("FFprobe Error");

        const duration = metadata.format.duration;
        console.log(`[SERVER] Duration: ${duration}s. Extracting 30 frames...`);

        // Empty old frames
        fs.readdirSync(framesDir).forEach(f => fs.rmSync(path.join(framesDir, f)));

        ffmpeg(req.file.path)
            .outputOptions([
                '-vframes 30',
                '-vf scale=640:-2' 
            ])
            .output(path.join(framesDir, 'frame-%03d.png'))
            .on('end', () => {
                console.log("[SERVER] Frame extraction SUCCESS. Booting OpenCV Engine...");
            // Point directly to the compiled executable
const enginePath = path.join(process.cwd(), 'analyzer.exe');

exec(`"${enginePath}" "${framesDir}"`, (error, stdout, stderr) => {
                    if (error) return res.status(500).send("Analysis Engine Failed");

                    try {
                        const pyResult = JSON.parse(stdout);
                        if (pyResult.error) return res.status(500).send(pyResult.error);

                        // NEW LOGIC: Find the exact frame with the highest slop score
                        let worstFrameIndex = 0;
                        let highestSlop = -1;
                        pyResult.heatmap.forEach((score, idx) => {
                            if (score > highestSlop) {
                                highestSlop = score;
                                worstFrameIndex = idx;
                            }
                        });

                        // Ffmpeg numbers frames starting at 1 (frame-001.png)
                        const frameNum = String(worstFrameIndex + 1).padStart(3, '0');
                        const worstFrameUrl = `http://localhost:3000/frames/frame-${frameNum}.png`;

                        res.json({
                            message: "Forensic Scan Complete",
                            fileName: req.file.originalname,
                            durationSeconds: duration.toFixed(2),
                            framesExtracted: pyResult.heatmap.length,
                            overallConfidence: pyResult.confidence,
                            heatmap: pyResult.heatmap,
                            // Send the image URL to React
                            evidenceUrl: worstFrameUrl,
                            evidenceFrame: worstFrameIndex,
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

app.listen(3000, () => {
    console.log("Slop Analyzer API running on http://localhost:3000");
});