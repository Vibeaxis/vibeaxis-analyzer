import sys
import os
import cv2
import numpy as np
import json

def analyze_optical_flow(folder_path):
    files = [f for f in os.listdir(folder_path) if f.endswith('.png')]
    files.sort(key=lambda x: int(''.join(filter(str.isdigit, x)) or 0))

    if len(files) < 5:
        return print(json.dumps({"error": "Need more consecutive frames."}))

    heatmap = []
    
    prev_frame = cv2.imread(os.path.join(folder_path, files[0]))
    prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)

    for i in range(1, len(files)):
        curr_frame = cv2.imread(os.path.join(folder_path, files[i]))
        curr_gray = cv2.cvtColor(curr_frame, cv2.COLOR_BGR2GRAY)

        # Calculate Dense Optical Flow
        flow = cv2.calcOpticalFlowFarneback(prev_gray, curr_gray, None, 
                                            0.5, 3, 15, 3, 5, 1.2, 0)
        
        # Convert to Magnitude (speed) and Angle (direction in radians)
        mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        
        # Filter out static pixels (ignoring the HUD and frozen crosshairs)
        moving_pixels_angles = ang[mag > 1.5] 
        
        if len(moving_pixels_angles) > 100: # Ensure there is actually enough motion to judge
            # Convert radians to degrees (0 to 360)
            angles_deg = moving_pixels_angles * (180 / np.pi)
            
            # Create a histogram with 36 "buckets" (10 degrees each)
            hist, _ = np.histogram(angles_deg, bins=36, range=(0, 360))
            
            # Find the biggest bucket (The Dominant Camera Motion)
            dominant_bucket_count = np.max(hist)
            total_moving_pixels = len(moving_pixels_angles)
            
            # What percentage of the moving screen is following the dominant pan?
            dominant_ratio = dominant_bucket_count / total_moving_pixels
            
            # THE VERDICT MATH:
            # If > 20% of moving pixels agree on a direction, it's highly cohesive (Real).
            # If < 5% agree, the pixels are boiling randomly (AI Slop).
            # We map this ratio inversely to a 0-100 Slop Probability.
            slop_prob = max(0, min(100, (1.0 - (dominant_ratio / 0.20)) * 100))
        else:
            # If nothing is moving, it's not slop, it's just a still image.
            slop_prob = 0
            
        heatmap.append(round(slop_prob))
        prev_gray = curr_gray

    heatmap.insert(0, 0)
    
    avg_slop = sum(heatmap) / len(heatmap)
    confidence = max(0, 100 - avg_slop)

    result = {
        "confidence": round(confidence, 1),
        "heatmap": heatmap
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    folder_target = sys.argv[1]
    analyze_optical_flow(folder_target)