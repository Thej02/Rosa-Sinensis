"""
src/deficiency_typing.py — Deficiency-Type Identification (Stage 8.5)

Maps combinations of failed primary factors to one of a small set of named patterns,
using an explicit botanical rule table for Hibiscus rosa-sinensis:

1. Iron (Fe) Deficiency:
   - Interveinal chlorosis: Veins remain dark green while interveinal lamina yellows.
   - Identified by: on-vein green retention >= 70%, on-vein yellow <= 25%, and vein preservation differential >= 8%.

2. Nitrogen (N) Deficiency:
   - Diffuse, systemic chlorosis: BOTH veins and lamina yellow uniformly together.
   - Identified by: on-vein yellow > 25% or on-vein green < 70% with low vein differential (< 8%).

3. Possible Pest / Pathogen / Physical Damage:
   - Localized, sharp necrotic spotting or insect bites (high color spatial variance > 500 without systemic chlorosis).

4. General Physiological / Nutrient Stress:
   - Mild early signs of nutrient imbalance or environmental stress.
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


def identify_deficiency(features: Dict[str, Any], failed_factors: List[Dict[str, Any]] = None) -> Dict[str, str]:
    """
    Map failed factors and vein-lamina differential features to a specific botanical deficiency pattern.
    Only to be invoked when Stage 8 returns NOT HEALTHY.

    Returns:
        Dict containing:
            'pattern_name': Short name of the identified pattern
            'deficiency_name': Human-readable title
            'recommended_nutrient': Horticultural recommendation
            'assessment_text': Full formatted assessment string for the report
    """
    variance = float(features.get('color_spatial_variance', 0.0))
    contrast = float(features.get('interveinal_contrast', 0.0))
    yellow_ratio = float(features.get('yellow_pixel_ratio', 0.0))
    dgci = float(features.get('dgci', 1.0))

    on_vein_green = float(features.get('on_vein_green_pct', 0.0))
    on_vein_yellow = float(features.get('on_vein_yellow_pct', 0.0))
    off_vein_yellow = float(features.get('off_vein_yellow_pct', 0.0))
    vein_diff = float(features.get('vein_preservation_diff', 0.0))

    disclaimer = (
        "This is an automated pattern-matching analysis based on vascular and pigment "
        "signatures — not a substitute for laboratory leaf-tissue testing."
    )

    # 1. Iron (Fe) Deficiency (Interveinal Chlorosis)
    # Primary botanical criterion: Veins STAY GREEN while lamina yellows!
    is_iron_deficiency = (
        (yellow_ratio >= YELLOW_RATIO_DEFICIENT or dgci < 0.58) and
        (
            (on_vein_green >= 70.0 and on_vein_yellow <= 25.0 and vein_diff >= 8.0) or
            (contrast >= 25.0 and on_vein_green >= 65.0 and vein_diff >= 6.0)
        )
    )

    # 2. Nitrogen (N) Deficiency (Diffuse Systemic Chlorosis)
    # Primary botanical criterion: Both veins AND lamina yellow uniformly together!
    is_nitrogen_deficiency = (
        (yellow_ratio >= YELLOW_RATIO_DEFICIENT or dgci < 0.58) and
        not is_iron_deficiency and
        (on_vein_yellow > 25.0 or on_vein_green < 70.0 or vein_diff < 8.0) and
        variance <= 700.0
    )

    # 3. Localized Pest / Disease / Necrotic Damage
    is_localized_damage = (
        variance > COLOR_SPATIAL_VARIANCE_MAX and
        not is_iron_deficiency and
        yellow_ratio < 0.50
    )

    if is_iron_deficiency:
        pattern_name = "Iron (Fe) Deficiency (Interveinal Chlorosis)"
        deficiency_name = "Iron (Fe) Deficiency"
        recommended_nutrient = (
            "Apply chelated iron foliar spray (Fe-EDDHA or Fe-EDTA at 1.0–1.5 g/L). "
            "Check soil pH (optimal 6.0–6.5 for Hibiscus rosa-sinensis); alkaline soil (pH > 7.0) locks out iron absorption."
        )
        text = (
            f"Pattern consistent with Iron (Fe) deficiency (classic interveinal chlorosis).\n"
            f"Vascular vein network retains strong green pigmentation ({on_vein_green:.1f}% green) while "
            f"interveinal tissue exhibits pronounced yellowing ({off_vein_yellow:.1f}% chlorosis).\n"
            f"Vein preservation differential is +{vein_diff:.1f}%, indicating active micronutrient lockout.\n"
            f"Recommended treatment: Foliar chelated iron (Fe-EDDHA) and soil pH adjustment.\n"
            f"{disclaimer}"
        )
    elif is_nitrogen_deficiency:
        pattern_name = "Nitrogen (N) Deficiency"
        deficiency_name = "Nitrogen (N) Deficiency"
        recommended_nutrient = (
            "Apply a water-soluble balanced high-nitrogen fertilizer (e.g. NPK 20-10-10 or 19-19-19) "
            "or organic fish emulsion/blood meal. Ensure consistent watering to support root nitrogen translocation."
        )
        text = (
            f"Pattern consistent with Nitrogen (N) deficiency (diffuse systemic chlorosis).\n"
            f"Yellowing extends uniformly across both the veins ({on_vein_yellow:.1f}% yellowed) and leaf lamina "
            f"({off_vein_yellow:.1f}% yellowed), without green vein preservation (differential: {vein_diff:.1f}%).\n"
            f"Nitrogen is a mobile macronutrient that is scavenged from mature foliage when deficient.\n"
            f"Recommended treatment: Balanced nitrogen fertilization and adequate root hydration.\n"
            f"{disclaimer}"
        )
    elif is_localized_damage:
        pattern_name = "Possible Pest / Pathogen / Physical Damage"
        deficiency_name = "Pest / Pathogen Damage"
        recommended_nutrient = (
            "Inspect leaf undersides for spider mites, aphids, or fungal spores. "
            "Apply organic neem oil spray (5 mL/L with mild surfactant) or appropriate botanical fungicide."
        )
        text = (
            f"Pattern consistent with localized pest, fungal, or physical injury.\n"
            f"Color spatial variance ({variance:.1f}) is high (>{COLOR_SPATIAL_VARIANCE_MAX:.1f}), "
            f"indicating sharp, localized, patchy discoloration rather than systemic nutrient chlorosis.\n"
            f"Recommend visual inspection of leaf undersides and targeted treatment.\n"
            f"{disclaimer}"
        )
    else:
        pattern_name = "General Nutrient Stress"
        deficiency_name = "General Chlorosis / Stress"
        recommended_nutrient = "Maintain regular balanced fertilization and check soil pH (optimal 6.0 - 6.5 for Hibiscus)."
        text = (
            f"Leaf flagged for mild physiological stress or early nutrient imbalance.\n"
            f"Recommend monitoring and ensuring balanced fertilization and adequate watering.\n"
            f"{disclaimer}"
        )

    return {
        'pattern_name': pattern_name,
        'deficiency_name': deficiency_name,
        'recommended_nutrient': recommended_nutrient,
        'assessment_text': text,
        'on_vein_green_pct': on_vein_green,
        'on_vein_yellow_pct': on_vein_yellow,
        'off_vein_yellow_pct': off_vein_yellow,
        'vein_preservation_diff': vein_diff
    }
