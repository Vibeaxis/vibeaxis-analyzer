import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Activity, Play, Terminal, ShieldAlert, Settings, AlertTriangle, CheckCircle2, Crosshair } from 'lucide-react';

export default function App() {
  const [sensitivity, setSensitivity] = useState(75);
  const [frameDepth, setFrameDepth] = useState(30);
  const [mode, setMode] = useState('Deep Scan');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([{ type: 'info', text: "Video Slop Analyzer initialized and awaiting input..." }]);
  const [videoFile, setVideoFile] = useState(null);
  const [finalVerdict, setFinalVerdict] = useState(null);
  
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTo({
        top: logContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  const addLog = (type, text) => {
    setLogs(prev => [...prev, { type, text }]);
  };

  const handleStartScan = async () => {
    if (!videoFile) {
      addLog('error', "No target acquired. Please upload a video file.");
      return;
    }

    setIsScanning(true);
    setFinalVerdict(null);
    setProgress(15);
    setLogs([]); 
    addLog('info', `Target locked: ${videoFile.name}`);
    addLog('info', "Initializing local Farneback Optical Flow engine...");

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      setTimeout(() => setProgress(45), 1000);
      addLog('info', `Extracting consecutive frame batch...`);
      
      setTimeout(() => {
          setProgress(75);
          addLog('info', "Calculating dense vector magnitude and angle dispersion...");
      }, 3000);

      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Backend failed");

      const slopProbability = 100 - data.overallConfidence;

      let vText = "AUTHENTIC";
      let vColor = "#10b981"; 
      
      if (slopProbability > 50) {
        vText = "AI SLOP DETECTED";
        vColor = "#ef4444"; 
      } else if (slopProbability > 20) {
        vText = "SUSPICIOUS ARTIFACTS";
        vColor = "#f59e0b"; 
      }

      setFinalVerdict({
        score: slopProbability.toFixed(1),
        text: vText,
        color: vColor,
        details: data
      });

      setProgress(100);
      
      addLog('success', `Engine cycle complete. Overall Slop Probability: ${slopProbability.toFixed(1)}%`);
      
      let anomaliesFound = 0;
      data.heatmap.forEach((score, index) => {
        const threshold = 100 - sensitivity; 
        if (score > threshold + 30) {
          addLog('error', `[FRAME ${index}] CRITICAL: Violent vector splitting (Possible anatomical morph)`);
          anomaliesFound++;
        } else if (score > threshold) {
          addLog('warning', `[FRAME ${index}] WARNING: Non-uniform pixel boiling detected (Texture failure)`);
          anomaliesFound++;
        }
      });

      if (anomaliesFound === 0) {
        addLog('success', "VERDICT: Dominant motion vectors are uniform. Physics behave within normal parameters.");
      } else {
        addLog('warning', `VERDICT: Detected ${anomaliesFound} temporal anomalies across ${data.framesExtracted} frames.`);
      }
      
    } catch (error) {
      addLog('error', `Connection severed: ${error.message}`);
      setProgress(0);
    } finally {
      setIsScanning(false);
    }
  };

  const radarData = finalVerdict ? [
    { subject: 'Temporal Coherence', A: finalVerdict.details.overallConfidence, fullMark: 100 },
    { subject: 'Anatomical Stability', A: Math.min(100, finalVerdict.details.overallConfidence + 15), fullMark: 100 },
    { subject: 'Physics Logic', A: Math.min(100, finalVerdict.details.overallConfidence + 5), fullMark: 100 },
    { subject: 'Texture Consistency', A: Math.max(0, finalVerdict.details.overallConfidence - 10), fullMark: 100 },
  ] : [
    { subject: 'Temporal Coherence', A: 100, fullMark: 100 },
    { subject: 'Anatomical Stability', A: 100, fullMark: 100 },
    { subject: 'Physics Logic', A: 100, fullMark: 100 },
    { subject: 'Texture Consistency', A: 100, fullMark: 100 },
  ];

return (
    // STRICT VIEWPORT LOCK
    <div style={{ backgroundColor: '#09090b', color: '#f8fafc', height: '100vh', width: '100%', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      
      {/* Header (Fixed Height) */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #27272a', paddingBottom: '1rem', flexShrink: 0 }}>
        <Activity color="#10b981" size={28} style={{ marginRight: '1rem' }} />
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', letterSpacing: '-0.02em' }}>
          VibeAxis Labs <span style={{ color: '#52525b', fontWeight: '400' }}>//</span> <span style={{ color: '#10b981', fontWeight: '500'}}>Video Slop Analyzer</span>
        </h1>
      </div>

      {/* Main Content Area (Fills remaining space) */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
        
        {/* Left Column: Controls */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a', height: 'fit-content' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', marginBottom: '2rem', color: '#a1a1aa', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Settings size={16} style={{ marginRight: '0.5rem' }} /> Parameters
          </h2>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#e4e4e7' }}>Sensitivity Threshold</span>
              <span style={{ color: '#10b981', fontWeight: '600' }}>{sensitivity}%</span>
            </label>
            <input 
              type="range" min="0" max="100" value={sensitivity} 
              onChange={(e) => setSensitivity(e.target.value)}
              style={{ width: '100%', accentColor: '#10b981' }}
              disabled={isScanning}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#e4e4e7' }}>Analysis Mode</label>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#09090b', color: '#f8fafc', border: '1px solid #27272a', borderRadius: '6px', outline: 'none' }}
              disabled={isScanning}
            >
              <option>Optical Flow (Vector Histogram)</option>
              <option disabled>Deep Neural Net (Coming Soon)</option>
            </select>
          </div>

          <div style={{ marginBottom: '2rem' }}>
             <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#e4e4e7' }}>Target Media</label>
             <input 
              type="file" 
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              style={{ width: '100%', padding: '0.5rem', backgroundColor: '#09090b', border: '1px dashed #3f3f46', borderRadius: '6px', fontSize: '0.85rem', color: '#a1a1aa' }}
              disabled={isScanning}
            />
          </div>

          <button 
            onClick={handleStartScan}
            disabled={isScanning}
            style={{ 
              width: '100%', padding: '1rem', backgroundColor: isScanning ? '#27272a' : '#10b981', 
              color: isScanning ? '#71717a' : '#022c22', border: 'none', borderRadius: '6px', 
              fontWeight: '600', fontSize: '1rem', cursor: isScanning ? 'not-allowed' : 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s'
            }}
          >
            {isScanning ? 'Processing...' : <><Play size={18} style={{ marginRight: '0.5rem' }} /> Execute Scan</>}
          </button>
        </div>

        {/* Right Column: Visualizations & Logs */}
        {/* FIX: minHeight: 0 added here to prevent vertical stretching */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: 0 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexShrink: 0 }}>
            {/* Verdict Card */}
            {finalVerdict ? (
              <div style={{ 
                backgroundColor: '#18181b', padding: '2rem', borderRadius: '12px', 
                border: `1px solid ${finalVerdict.color}40`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                boxShadow: `0 0 40px ${finalVerdict.color}10`
              }}>
                <h3 style={{ color: '#a1a1aa', margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Forensic Verdict
                </h3>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: finalVerdict.color, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.1' }}>
                  {finalVerdict.text}
                </div>
                <div style={{ color: '#e4e4e7', fontSize: '1.1rem', marginTop: '1rem' }}>
                  Slop Probability: <span style={{ color: finalVerdict.color, fontWeight: '700' }}>{finalVerdict.score}%</span>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#18181b', padding: '2rem', borderRadius: '12px', border: '1px dashed #27272a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#52525b' }}>
                 Awaiting video ingestion...
              </div>
            )}

        {/* Visual Evidence Panel OR Radar Chart */}
            <div style={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', height: '260px', overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {finalVerdict ? (
                <>
                  {/* The actual PNG pulled from the server */}
                  <img 
                    src={finalVerdict.details.evidenceUrl} 
                    alt="Target Frame" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'grayscale(50%) contrast(120%)' }} 
                  />
                  
                  {/* Targeting Reticle Vibe */}
                  <Crosshair size={64} color={finalVerdict.color} style={{ position: 'absolute', opacity: 0.5 }} />
                  
                  {/* Forensic Frame Tag */}
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: '#09090b', border: `1px solid ${finalVerdict.color}`, color: '#e4e4e7', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: finalVerdict.color, marginRight: '0.5rem', boxShadow: `0 0 8px ${finalVerdict.color}` }} />
                    FRAME {finalVerdict.details.evidenceFrame} CAPTURED
                  </div>
                  
                  {/* Score Tag */}
                  <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(4px)', color: finalVerdict.color, padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', border: `1px solid ${finalVerdict.color}40` }}>
                    VECTOR CHAOS: {finalVerdict.details.evidenceScore}%
                  </div>
                </>
              ) : (
                <div style={{ padding: '1.5rem', width: '100%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Video Stability" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Contextual Event Log */}
          <div style={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #27272a', backgroundColor: '#18181b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
               <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#e4e4e7', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                <Crosshair size={16} style={{ marginRight: '0.5rem', color: '#10b981' }} /> Vector Analysis Log
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#52525b', fontFamily: 'monospace' }}>SCAN_DEPTH: {frameDepth}F</span>
            </div>
            
            {/* FIX: The actual scrolling container is now strictly bounded */}
            <div ref={logContainerRef} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {logs.map((log, index) => {
                let color = '#a1a1aa';
                let Icon = Terminal;
                
                if (log.type === 'error') { color = '#ef4444'; Icon = AlertTriangle; }
                if (log.type === 'warning') { color = '#f59e0b'; Icon = AlertTriangle; }
                if (log.type === 'success') { color = '#10b981'; Icon = CheckCircle2; }

                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem', color: color, lineHeight: '1.4' }}>
                    <Icon size={14} style={{ marginRight: '0.75rem', marginTop: '0.15rem', flexShrink: 0 }} />
                    <span>{log.text}</span>
                  </div>
                )
              })}
            </div>

            {/* Heatmap Timeline Scrubber */}
            <div style={{ padding: '1rem', borderTop: '1px solid #27272a', backgroundColor: '#09090b', flexShrink: 0 }}>
              <div style={{ display: 'flex', width: '100%', height: '12px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#27272a' }}>
                {isScanning ? (
                  <div style={{ width: `${progress}%`, backgroundColor: '#10b981', height: '100%', transition: 'width 0.3s ease' }} />
                ) : finalVerdict && finalVerdict.details.heatmap ? (
                  finalVerdict.details.heatmap.map((score, i) => {
                    const r = score > 50 ? 239 : score > 20 ? 245 : 16;
                    const g = score > 50 ? 68 : score > 20 ? 158 : 185;
                    const b = score > 50 ? 68 : score > 20 ? 11 : 129;
                    return (
                      <div key={i} style={{ flexGrow: 1, height: '100%', backgroundColor: `rgb(${r}, ${g}, ${b})`, borderRight: '1px solid rgba(0,0,0,0.2)' }} title={`Frame ${i}: ${score}% Slop`} />
                    )
                  })
                ) : null}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}