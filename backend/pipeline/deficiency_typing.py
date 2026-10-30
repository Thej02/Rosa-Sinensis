"""
src/deficiency_typing.py — Deficiency-Type Identification (Stage 8.5)

Maps combinations of failed primary factors to one of a small set of named patterns,
using an explicit, non-ML rule table based on botanical literature for Hibiscus rosa-sinensis.

Outputs are always hedged as pattern matches, not diagnostic claims.
"""

from typing import Dict, List, Any
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config.thresholds import (
    COLOR_SPATIAL_VARIANCE_MAX,
    INTERVEINAL_CONTRAST_THRESHOLD,
    YELLOW_RATIO_DEFICIENT,
)

def identify_deficiency(features: Dict[str, Any], failed_factors: List[Dict[str, Any]]) -> Dict[str, str]:
    """
    Map failed factors to a known deficiency or damage pattern.
    Only to be invoked when Stage 8 returns NOT HEALTHY.

    Agronomic Logic:
    1. Iron (Fe) / Magnesium (Mg) Deficiency:
       - Signature: Interveinal chlorosis (veins remain green while interveinal lamina yellows).
       - Detected when: contrast > INTERVEINAL_CONTRAST_THRESHOLD (>=28.0) and yellow_ratio > YELLOW_RATIO_DEFICIENT (>=8%).
       - Note: Alternation between dark green veins and yellow tissue naturally creates high spatial variance,
         so interveinal contrast MUST be prioritized over generic spatial variance.
    2. Nitrogen (N) Deficiency:
       - Signature: Uniform, diffuse chlorosis across both veins and lamina.
       - Detected when: yellow_ratio > YELLOW_RATIO_DEFICIENT and contrast <= INTERVEINAL_CONTRAST_THRESHOLD.
    3. Possible Pest / Pathogen / Physical Damage:
       - Signature: Localized sharp necrotic spots or insect bites without systemic interveinal contrast.
       - Detected when: variance > COLOR_SPATIAL_VARIANCE_MAX and contrast <= INTERVEINAL_CONTRAST_THRESHOLD.

    Returns:
        Dict containing:
            'pattern_name': Short name of the identified pattern
            'deficiency_name': Human-readable title
            'recommended_nutrient': Horticultural recommendation
            'assessment_text': Full formatted assessment string for the report
    """
    variance = features.get('color_spatial_variance', 0.0)
    contrast = features.get('interveinal_contrast', 0.0)
    yellow_ratio = features.get('yellow_pixel_ratio', 0.0)

    disclaimer = (
        "This is a pattern-matching estimate based on color and vein "
        "signals only — not a substitute for soil/tissue testing or expert diagnosis."
    )

    # 1. Primary Nutritional Etiology: Chlorosis with High Interveinal Contrast
    if contrast >= INTERVEINAL_CONTRAST_THRESHOLD and yellow_ratio >= YELLOW_RATIO_DEFICIENT:
        pattern_name = "Iron (Fe) Deficiency (Interveinal Chlorosis)"
        recommended_nutrient = "Apply chelated iron foliar spray (Fe-EDDHA or Fe-EDTA at 1.0–1.5 g/L). Check soil pH (optimal 6.0–6.5 for Hibiscus)."
        text = (
            f"Pattern consistent with Iron (Fe) or Magnesium (Mg) deficiency (interveinal chlorosis).\n"
            f"Veins remain green while surrounding leaf tissue yellows between veins.\n"
            f"Interveinal contrast ({contrast:.1f}) is elevated (≥{INTERVEINAL_CONTRAST_THRESHOLD:.1f}) and "
            f"chlorosis extent ({yellow_ratio:.1%}) is above threshold (≥{YELLOW_RATIO_DEFICIENT:.1%}).\n"
            f"Iron deficiency typically shows on young crown leaves, while magnesium appears on older mature foliage.\n"
            f"Recommended treatment: Foliar chelated iron application (Fe-EDDHA) and soil pH verification.\n"
            f"{disclaimer}"
        )
    # 2. Primary Nutritional Etiology: Diffuse Systemic Chlorosis (Nitrogen Deficiency)
    elif yellow_ratio >= YELLOW_RATIO_DEFICIENT and contrast < INTERVEINAL_CONTRAST_THRESHOLD and variance <= COLOR_SPATIAL_VARIANCE_MAX:
        pattern_name = "Nitrogen (N) Deficiency"
        recommended_nutrient = "Apply a water-soluble balanced N-P-K fertilizer (e.g. 19-19-19 or 20-20-20) or organic nitrogen compost tea."
        text = (
            f"Pattern consistent with Nitrogen (N) deficiency (diffuse, uniform yellowing across both veins and lamina).\n"
            f"Yellow pixel ratio ({yellow_ratio:.1%}) is elevated (≥{YELLOW_RATIO_DEFICIENT:.1%}) while "
            f"interveinal contrast ({contrast:.1f}) remains low-to-moderate (<{INTERVEINAL_CONTRAST_THRESHOLD:.1f}).\n"
            f"Recommended treatment: Balanced nitrogen fertilization and routine watering.\n"
            f"{disclaimer}"
        )
    # 3. Localized Patchy Damage / Pest / Pathogen
    elif variance > COLOR_SPATIAL_VARIANCE_MAX:
        pattern_name = "Possible pest/disease/damage"
        recommended_nutrient = "Inspect leaf undersides for spider mites, aphids, or fungal spores. Apply organic neem oil spray."
        text = (
            f"Pattern consistent with localized pest, fungal, or physical injury.\n"
            f"Color spatial variance ({variance:.1f}) is high (>{COLOR_SPATIAL_VARIANCE_MAX:.1f}), "
            f"indicating sharp, localized, patchy discoloration rather than systemic chlorosis.\n"
            f"Recommend visual inspection of leaf undersides and neem oil treatment.\n"
            f"{disclaimer}"
        )
    # 4. General / Early Nutrient Stress
    else:
        pattern_name = "General Nutrient Stress"
        recommended_nutrient = "Maintain regular balanced fertilization and check soil pH (optimal 6.0 - 6.5 for Hibiscus)."
        text = (
            f"Leaf flagged for mild physiological stress or early nutrient imbalance.\n"
            f"Recommend monitoring and ensuring balanced fertilization and adequate watering.\n"
            f"{disclaimer}"
        )

    return {
        'pattern_name': pattern_name,
        'deficiency_name': pattern_name,
        'recommended_nutrient': recommended_nutrient,
        'assessment_text': text
    }
