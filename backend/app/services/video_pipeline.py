import cv2
import json
import shlex
import subprocess
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.config import Settings


@dataclass
class ProcessedClip:
    clip_id: str
    final_path: Path
    thumbnail_path: Path
    duration: int
    platform: str


@dataclass
class HighlightEvent:
    user_id: str
    platform: str
    vod_url: str
    timestamp_seconds: int
    username: str
    watermark_text: str
    stream_id: str | None = None


class VideoPipelineService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._gemini_configured = False
        if settings.gemini_api_key and settings.gemini_api_key != "YOUR_GEMINI_API_KEY":
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                self._gemini_configured = True
            except Exception as e:
                print(f"Gemini config failed: {e}")

    def process_url(self, video_url: str, watermark: str, keywords: list[str] | None = None) -> list[ProcessedClip]:
        source_id = str(uuid.uuid4())
        workspace = self.settings.temp_dir / source_id
        workspace.mkdir(parents=True, exist_ok=True)

        # 1. Download full audio
        audio_path = workspace / "full_audio.mp3"
        print(f"[pipeline] Downloading audio from {video_url}")
        self.download_full_audio(video_url, audio_path)

        # 2. Transcribe using Python whisper library
        print("[pipeline] Transcribing audio...")
        transcript = self.get_full_transcript(audio_path)

        # 3. Analyze for hooks using Gemini (or fall back to default segments)
        print("[pipeline] Analyzing for viral hooks...")
        hooks = self.analyze_viral_hooks(transcript, keywords=keywords)
        if not hooks:
            hooks = [{"start": 0, "end": 60, "reason": "Default segment"}]

        clips = []
        for i, hook in enumerate(hooks[:3]):
            start = hook["start"]
            end = hook["end"]
            duration = end - start

            clip_uuid = f"{source_id}_{i}"
            raw_path = workspace / f"raw_{i}.mp4"
            final_path = self.settings.clip_output_dir / f"{clip_uuid}.mp4"
            thumb_path = self.settings.clip_output_dir / f"{clip_uuid}.jpg"

            print(f"[pipeline] Downloading segment {i+1}: {start}s–{end}s")
            self.download_segment(video_url, start, end, raw_path)

            # 4. Intelligent Auto-Crop
            print(f"[pipeline] Detecting faces for smart crop...")
            crop_x = self.auto_crop_vertical(raw_path)

            print(f"[pipeline] Rendering vertical clip {i+1}...")
            self.render_vertical_clip(raw_path, final_path, watermark, crop_x=crop_x)
            self.generate_thumbnail(final_path, thumb_path)

            clips.append(ProcessedClip(
                clip_id=clip_uuid,
                final_path=final_path,
                thumbnail_path=thumb_path,
                duration=int(duration),
                platform=self._get_platform(video_url),
            ))

        print(f"[pipeline] Done! Generated {len(clips)} clips.")
        return clips

    def _get_platform(self, video_url: str) -> str:
        if "twitch.tv" in video_url.lower():
            return "twitch"
        if "kick.com" in video_url.lower():
            return "kick"
        return "youtube"

    def download_full_audio(self, video_url: str, output_path: Path) -> None:
        cmd = [
            "yt-dlp",
            "-x",
            "--audio-format", "mp3",
            "-o", str(output_path),
            video_url,
        ]
        self._run(cmd)

    def get_full_transcript(self, audio_path: Path) -> str:
        """Transcribe using the whisper Python library directly (not CLI)."""
        try:
            import whisper
            model = whisper.load_model("tiny")
            result = model.transcribe(str(audio_path), fp16=False)
            return result.get("text", "")
        except Exception as e:
            print(f"[pipeline] Whisper transcription failed: {e}")
            return ""

    def analyze_viral_hooks(self, transcript: str, keywords: list[str] | None = None) -> list[dict]:
        if not transcript or not self._gemini_configured:
            return []

        keyword_context = ""
        if keywords:
            keyword_context = f"\nFocus especially on segments containing these keywords: {', '.join(keywords)}"

        prompt = f"""
        Analyze the following transcript from a video and identify the 3 most viral, engaging, or emotional segments.
        Exclude intro/outro filler. Focus on clips that would work well as TikToks or Reels.
        Each clip should be 30-60 seconds long.
        {keyword_context}

        For each segment, provide the start and end time in seconds (as integers).
        Return ONLY a JSON array of objects with "start", "end", and "reason" keys. No explanation, no markdown.

        Transcript:
        {transcript[:5000]}
        """

        try:
            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            print(f"[pipeline] Gemini analysis failed: {e}")
            return []

    def download_segment(self, vod_url: str, start: int, end: int, output_path: Path) -> None:
        cmd = [
            "yt-dlp",
            "-f", "bv[ext=mp4]+ba[ext=m4a]/b[ext=mp4]",
            "--merge-output-format", "mp4",
            "--download-sections",
            f"*{start}-{end}",
            "-o",
            str(output_path),
            vod_url,
        ]
        self._run(cmd)

    def render_vertical_clip(
        self,
        input_path: Path,
        output_path: Path,
        watermark: str,
        crop_x: int | None = None,
    ) -> None:
        """Render a vertical 9:16 clip with intelligent cropping."""

        # Probe the input to get actual dimensions
        probe_cmd = [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=p=0",
            str(input_path),
        ]
        try:
            probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
            w_str, h_str = probe_result.stdout.strip().split(",")
            src_w, src_h = int(w_str), int(h_str)
        except Exception:
            src_w, src_h = 1920, 1080

        # Target: 1080x1920
        target_w, target_h = 1080, 1920

        # Calculate crop region from source
        # We want to extract a column of width = src_h * (9/16) from the source
        crop_w = int(src_h * 9 / 16)
        if crop_w > src_w:
            crop_w = src_w

        if crop_x is not None:
            start_x = max(0, min(src_w - crop_w, int(crop_x - crop_w / 2)))
        else:
            start_x = max(0, (src_w - crop_w) // 2)

        filter_complex = (
            f"crop={crop_w}:{src_h}:{start_x}:0,"
            f"scale={target_w}:{target_h}:flags=lanczos"
        )

        output_path.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(input_path),
            "-vf", filter_complex,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "160k",
            "-movflags", "+faststart",
            str(output_path),
        ]
        self._run(cmd)

    def auto_crop_vertical(self, video_path: Path) -> int:
        """Detect the speaker's face using mediapipe Tasks API and return median X coordinate."""
        try:
            import mediapipe as mp
            from mediapipe.tasks.python import BaseOptions, vision

            # Path to the downloaded model file
            model_path = Path(__file__).resolve().parent.parent.parent / "data" / "blaze_face_short_range.tflite"
            if not model_path.exists():
                print(f"[pipeline] Face model not found at {model_path}, using center crop")
                return self._get_video_width(video_path) // 2

            options = vision.FaceDetectorOptions(
                base_options=BaseOptions(model_asset_path=str(model_path)),
                min_detection_confidence=0.5,
            )
            detector = vision.FaceDetector.create_from_options(options)

            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                return 960

            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            step = int(fps)  # Sample every ~1 second

            face_x_positions = []

            for i in range(0, frame_count, step):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                if not ret:
                    break

                # Convert BGR → RGB for mediapipe
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

                result = detector.detect(mp_image)

                if result.detections:
                    bbox = result.detections[0].bounding_box
                    center_x = bbox.origin_x + bbox.width / 2
                    face_x_positions.append(center_x)

            cap.release()

            if not face_x_positions:
                return width // 2

            # Use median for stability
            face_x_positions.sort()
            return int(face_x_positions[len(face_x_positions) // 2])

        except Exception as e:
            print(f"[pipeline] Face detection failed: {e}")
            return self._get_video_width(video_path) // 2

    def _get_video_width(self, video_path: Path) -> int:
        """Get video width using OpenCV."""
        try:
            cap = cv2.VideoCapture(str(video_path))
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            cap.release()
            return w if w > 0 else 1920
        except Exception:
            return 1920

    def generate_thumbnail(self, input_path: Path, output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(input_path),
            "-ss", "00:00:01",
            "-vframes", "1",
            str(output_path),
        ]
        self._run(cmd)

    def _run(self, cmd: list[str]) -> None:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"Command failed: {shlex.join(cmd)}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
            )
