import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Add current dir to path to import app/
sys.path.append(os.getcwd())

from app.config import Settings
from app.services.video_pipeline import VideoPipelineService

async def test_ai_pipeline():
    settings = Settings()
    # Mocking Gemini if no API key is present for the test environment
    if not settings.gemini_api_key:
        print("GEMINI_API_KEY not found. Running with mock data.")
    
    pipeline = VideoPipelineService(settings)
    
    # We'll mock some methods to avoid external dependencies during a simple logic check
    # But for a real test, we'd want to run it on a real (short) clip if keys are present.
    
    video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" # Rickroll
    watermark = "ClipTest"
    
    print(f"Testing pipeline for: {video_url}")
    
    # Mock transcription and hook analysis to avoid cost/delay in CI
    pipeline.get_full_transcript = MagicMock(return_value="This is a very emotional peak in the video where something surprising happens. The hook is here.")
    pipeline.analyze_viral_hooks = MagicMock(return_value=[{"start": 10, "end": 40, "reason": "Emotional peak"}])
    
    # Mock download methods to avoid huge downloads
    pipeline.download_full_audio = MagicMock()
    pipeline.download_segment = MagicMock()
    
    # Mock FFmpeg and CV2 logic that might fail in non-interactive environments
    pipeline.auto_crop_vertical = MagicMock(return_value=960)
    pipeline.render_vertical_clip = MagicMock()
    pipeline.generate_thumbnail = MagicMock()
    
    clips = pipeline.process_url(video_url, watermark)
    
    print(f"Generated {len(clips)} clips.")
    for i, clip in enumerate(clips):
        print(f"Clip {i}: {clip.clip_id}, duration: {clip.duration}s")
        assert clip.duration == 30
        assert "youtube" in clip.platform

    print("Pipeline logic test passed!")

if __name__ == "__main__":
    asyncio.run(test_ai_pipeline())
