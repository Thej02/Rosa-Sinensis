"""
Rosa-sinensis Leaf Health Diagnostic System - Backend Package
=============================================================
Modular, clean backend containing:
- pipeline: Classical 12-stage Computer Vision and leaf vein processing pipeline
- severity: Multi-paradigm severity classification (Rule-based, Classical ML, Deep Learning)
- config: Calibrated botanical threshold definitions
"""

import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Provide compatibility aliases so any module referencing 'src' or 'severityClass' works directly
try:
    from . import pipeline
    from . import severity
    from . import config
    sys.modules['src'] = pipeline
    sys.modules['pipeline'] = pipeline
    sys.modules['severityClass'] = severity
    sys.modules['severity'] = severity
    sys.modules['config'] = config
except Exception:
    pass
