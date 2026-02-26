from __future__ import annotations

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

    def process_highlight(self, highlight: HighlightEvent) -> ProcessedClip:
        clip_id = str(uuid.uuid4())
        workspace = self.settings.temp_dir / clip_id
        workspace.mkdir(parents=True, exist_ok=True)

        start = max(0, highlight.timestamp_seconds - 15)
        end = highlight.timestamp_seconds + 30

        raw_path = workspace / "raw.mp4"
        srt_path = workspace / "captions.srt"
        final_path = self.settings.clip_output_dir / f"{clip_id}.mp4"
        thumb_path = self.settings.clip_output_dir / f"{clip_id}.jpg"

        self.download_segment(highlight.vod_url, start, end, raw_path)
        self.generate_captions(raw_path, srt_path)
        self.render_vertical_clip(raw_path, srt_path, final_path, highlight.watermark_text)
        self.generate_thumbnail(final_path, thumb_path)

        return ProcessedClip(
            clip_id=clip_id,
            final_path=final_path,
            thumbnail_path=thumb_path,
            duration=end - start,
            platform=highlight.platform,
        )

    def download_segment(self, vod_url: str, start: int, end: int, output_path: Path) -> None:
        section = f"*{start}-{end}"
        cmd = [
            "yt-dlp",
            "--download-sections",
            section,
            "-o",
            str(output_path),
            vod_url,
        ]
        self._run(cmd)

    def generate_captions(self, input_path: Path, srt_output: Path) -> None:
        output_dir = srt_output.parent
        cmd = [
            "whisper",
            str(input_path),
            "--model",
            "base",
            "--task",
            "transcribe",
            "--output_format",
            "srt",
            "--output_dir",
            str(output_dir),
        ]
        self._run(cmd)

        generated = output_dir / f"{input_path.stem}.srt"
        if generated.exists() and generated != srt_output:
            generated.rename(srt_output)

    def render_vertical_clip(
        self,
        input_path: Path,
        srt_path: Path,
        output_path: Path,
        watermark: str,
    ) -> None:
        safe_watermark = watermark.replace("'", "\\'") or "ClipperAI"
        subtitle_file = str(srt_path).replace("'", "\\'")

        filter_complex = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,boxblur=10:2,crop=1080:1920[bg];"
            "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2,"
            f"drawtext=text='{safe_watermark}':x=w-tw-48:y=48:fontsize=42:fontcolor=white@0.6:borderw=2:bordercolor=black@0.5,"
            f"subtitles='{subtitle_file}':force_style='Fontsize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1,Outline=2,Alignment=2,MarginV=120'"
        )

        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-vf",
            filter_complex,
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            str(output_path),
        ]
        self._run(cmd)

    def generate_thumbnail(self, input_path: Path, output_path: Path) -> None:
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-ss",
            "00:00:01",
            "-vframes",
            "1",
            str(output_path),
        ]
        self._run(cmd)

    def _run(self, cmd: list[str]) -> None:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"Command failed: {shlex.join(cmd)}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
            )
