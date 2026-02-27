import sys
from pathlib import Path

# Add the backend directory to the Python path so Vercel can find the 'app' module
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.main import app
