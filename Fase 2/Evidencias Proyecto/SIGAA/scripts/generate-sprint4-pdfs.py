#!/usr/bin/env python3
"""Compatibilidad: genera las rutas canónicas desde las fuentes vigentes."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
subprocess.run([sys.executable, str(ROOT / "scripts/generate-scrum-pdfs.py"),
                "--manifest", str(ROOT / "scripts/document-regularization.json")], check=True)
