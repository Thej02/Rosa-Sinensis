"""
src/decision_engine.py — Rule-based health verdict engine.

Takes a feature dict (from feature_extraction.py) and produces:
  1. A verdict: "Leaf Health Status: HEALTHY" or "Leaf Health Status: NOT HEALTHY"
  2. A human-readable reasoning string explaining which features
     crossed which thresholds and what deficiency pattern that
     combination resembles.

This is a deterministic, explicit botanical rule engine.
All thresholds are imported from config/thresholds.py.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config.thresholds import (
    YELLOW_RATIO_DEFICIENT,
    EXG_HEALTHY_LOW,
    DGCI_HEALTHY_LOW,
    INTERVEINAL_CONTRAST_THRESHOLD,
    COLOR_SPATIAL_VARIANCE_MAX,
    VEIN_DENSITY_DEFICIENT,
    VEIN_THICKNESS_DEFICIENT_HIGH,
)
try:
    from .deficiency_typing import identify_deficiency
except (ImportError, ValueError):
    try:
        from pipeline.deficiency_typing import identify_deficiency
    except (ImportError, ValueError):
        from deficiency_typing import identify_deficiency


# Verdict constants
VERDICT_HEALTHY = "Leaf Health Status: HEALTHY"
VERDICT_NOT_HEALTHY = "Leaf Health Status: NOT HEALTHY"


def evaluate(features: dict) -> dict:
    """
    Evaluate leaf health based on extracted features using botanical multi-signal logic.

    Botanical criteria for HEALTHY Rosa-sinensis leaf:
      1. Low chlorosis (yellow_pixel_ratio <= 8%)
      2. Vibrant dark green index (DGCI >= 0.58)
      3. Normal excess green index (ExG >= 0.38)
      4. Smooth lamina without severe necrotic spotting (variance <= 500)

    Args:
        features: Dict of feature values from feature_extraction.extract_all_features().

    Returns:
        Dict with keys:
          'verdict': str — one of VERDICT_HEALTHY, VERDICT_NOT_HEALTHY
          'confidence_signals': int — how many individual features flagged deficiency
          'reasoning': str — human-readable explanation of the verdict
          'flags': list of dict — each flagged feature with its value, threshold, and meaning
          'deficiency_assessment': dict (if NOT HEALTHY)
    """
    primary_flags = []

    yellow_ratio = features.get('yellow_pixel_ratio', 0.0)
    if yellow_ratio > YELLOW_RATIO_DEFICIENT:
        primary_flags.append({
            'feature': 'yellow_pixel_ratio',
            'value': yellow_ratio,
            'threshold': YELLOW_RATIO_DEFICIENT,
            'type': 'primary',
            'meaning': (
                f"Yellow pixel ratio ({yellow_ratio:.1%}) is above the healthy "
                f"baseline (>{YELLOW_RATIO_DEFICIENT:.1%}). Elevated yellowing "
                f"(chlorosis) indicates chlorophyll breakdown from nutrient deficiency."
            ),
        })

    exg = features.get('excess_green_index', 1.0)
    if exg < EXG_HEALTHY_LOW:
        primary_flags.append({
            'feature': 'excess_green_index',
            'value': exg,
            'threshold': EXG_HEALTHY_LOW,
            'type': 'primary',
            'meaning': (
                f"Excess Green Index ({exg:.4f}) is below the healthy "
                f"threshold ({EXG_HEALTHY_LOW:.4f}). This indicates reduced "
                f"green reflectance, consistent with chlorophyll loss."
            ),
        })

    dgci = features.get('dgci', 1.0)
    if dgci < DGCI_HEALTHY_LOW:
        primary_flags.append({
            'feature': 'dgci',
            'value': dgci,
            'threshold': DGCI_HEALTHY_LOW,
            'type': 'primary',
            'meaning': (
                f"Dark Green Color Index ({dgci:.4f}) is below the healthy "
                f"threshold ({DGCI_HEALTHY_LOW:.4f}). Low DGCI indicates pale "
                f"or washed-out leaf color."
            ),
        })

    interveinal = features.get('interveinal_contrast', 0.0)
    # Interveinal chlorosis only occurs when contrast is high AND yellowing is present
    if interveinal > INTERVEINAL_CONTRAST_THRESHOLD and yellow_ratio > 0.06:
        primary_flags.append({
            'feature': 'interveinal_contrast',
            'value': interveinal,
            'threshold': INTERVEINAL_CONTRAST_THRESHOLD,
            'type': 'primary',
            'meaning': (
                f"Interveinal contrast ({interveinal:.1f}) exceeds threshold "
                f"({INTERVEINAL_CONTRAST_THRESHOLD:.1f}) in presence of chlorosis. "
                f"This 'green veins with yellowing lamina' pattern is characteristic of Fe or Mg deficiency."
            ),
        })

    variance = features.get('color_spatial_variance', 0.0)
    if variance > COLOR_SPATIAL_VARIANCE_MAX:
        primary_flags.append({
            'feature': 'color_spatial_variance',
            'value': variance,
            'threshold': COLOR_SPATIAL_VARIANCE_MAX,
            'type': 'primary',
            'meaning': (
                f"Color spatial variance ({variance:.1f}) is very high "
                f"(>{COLOR_SPATIAL_VARIANCE_MAX:.1f}). This suggests sharp, localized "
                f"discoloration or necrotic spotting."
            ),
        })

    # ─────────────────────────────────────────────────────────────────────────
    # Secondary Factors (Vein Geometry)
    # ─────────────────────────────────────────────────────────────────────────
    secondary_flags = []

    vein_density = features.get('vein_density', 1.0)
    if vein_density < VEIN_DENSITY_DEFICIENT:
        secondary_flags.append({
            'feature': 'vein_density',
            'value': vein_density,
            'threshold': VEIN_DENSITY_DEFICIENT,
            'type': 'secondary',
            'meaning': (
                f"Vein density ({vein_density:.4f}) is below baseline "
                f"({VEIN_DENSITY_DEFICIENT:.4f}). Impaired vascular reticulation."
            ),
        })

    vein_thickness = features.get('vein_thickness_avg', 0.0)
    if vein_thickness > VEIN_THICKNESS_DEFICIENT_HIGH:
        secondary_flags.append({
            'feature': 'vein_thickness_avg',
            'value': vein_thickness,
            'threshold': VEIN_THICKNESS_DEFICIENT_HIGH,
            'type': 'secondary',
            'meaning': (
                f"Average vein thickness ({vein_thickness:.2f}px) is above baseline "
                f"({VEIN_THICKNESS_DEFICIENT_HIGH:.2f}px)."
            ),
        })

    # ─────────────────────────────────────────────────────────────────────────
    # Botanical Consensus Evaluation
    # ─────────────────────────────────────────────────────────────────────────
    # A leaf is conclusively HEALTHY if:
    # 1. Yellowing is minimal (<= 6%) AND DGCI indicates deep green (>= 0.60) AND no severe necrosis (variance <= 500)
    # 2. Or no primary flags are raised.
    is_conclusively_green = (yellow_ratio <= 0.06 and dgci >= 0.60 and variance <= COLOR_SPATIAL_VARIANCE_MAX)

    if is_conclusively_green or len(primary_flags) == 0:
        verdict = VERDICT_HEALTHY
        flags = []  # No penalty flags for healthy leaf
        deficiency_assessment = None
    else:
        verdict = VERDICT_NOT_HEALTHY
        flags = primary_flags + secondary_flags
        deficiency_assessment = identify_deficiency(features, flags)

    total_flags = len(flags)

    # ── Build reasoning string ─────────────────────────────────────────
    reasoning = _build_reasoning(verdict, flags, features, deficiency_assessment)

    return {
        'verdict': verdict,
        'confidence_signals': total_flags,
        'reasoning': reasoning,
        'flags': flags,
        'deficiency_assessment': deficiency_assessment,
    }


def _build_reasoning(verdict: str, flags: list, features: dict, deficiency_assessment: dict = None) -> str:
    """
    Build a human-readable reasoning string explaining the verdict.
    """
    lines = []

    lines.append(f"VERDICT: {verdict}")
    lines.append("")

    if verdict == VERDICT_HEALTHY:
        lines.append(
            "All measured features are within the expected healthy range for "
            "Rosa-sinensis. No signs of nutrient deficiency detected."
        )
        lines.append("")
        lines.append("Feature summary:")
        lines.append(f"  • Vein density: {features.get('vein_density', 0):.4f}")
        lines.append(f"  • Yellow pixel ratio: {features.get('yellow_pixel_ratio', 0):.1%}")
        lines.append(f"  • Excess Green Index: {features.get('excess_green_index', 0):.4f}")
        lines.append(f"  • DGCI: {features.get('dgci', 0):.4f}")
        lines.append(f"  • Color Spatial Variance: {features.get('color_spatial_variance', 0):.1f}")
    else:
        lines.append(
            f"{len(flags)} feature(s) outside the healthy baseline range:"
        )
        lines.append("")

        for i, flag in enumerate(flags, 1):
            lines.append(f"  {i}. {flag['meaning']}")
            lines.append("")

        lines.append("DEFICIENCY-TYPE ANALYSIS:")
        if deficiency_assessment:
            for line in deficiency_assessment.get('assessment_text', '').split('\n'):
                lines.append(f"  {line}")
        else:
            lines.append("  Analysis not available.")

    return "\n".join(lines)
