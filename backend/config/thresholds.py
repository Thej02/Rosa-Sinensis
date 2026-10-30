"""
config/thresholds.py — Central threshold configuration for the decision engine.

All numeric thresholds used by the rule-based decision engine live here.
These values are calibrated for Hibiscus rosa-sinensis leaves and must NEVER
be hardcoded inline in decision_engine.py or any other module.

Every threshold includes:
  - Its numeric value
  - A comment explaining what it represents
"""

# ─────────────────────────────────────────────────────────────────────────────
# Segmentation thresholds (Stage 4)
# ─────────────────────────────────────────────────────────────────────────────

# HSV ranges for leaf segmentation (used in cv2.inRange)
# These define what counts as "leaf green" vs background.
# Format: (H_min, S_min, V_min), (H_max, S_max, V_max)
LEAF_HSV_LOWER = (25, 30, 30)     # lower bound of green-ish hue range
LEAF_HSV_UPPER = (95, 255, 255)   # upper bound of green-ish hue range

# Minimum leaf area as fraction of total image area (reject if leaf is too small)
MIN_LEAF_AREA_FRACTION = 0.10

# Morphological kernel size for mask cleanup (pixels)
MORPH_KERNEL_SIZE = 7

# ─────────────────────────────────────────────────────────────────────────────
# Preprocessing thresholds (Stage 4)
# ─────────────────────────────────────────────────────────────────────────────

# Standard working resolution: longest edge resized to this many pixels
WORKING_RESOLUTION = 1024

# CLAHE parameters for brightness normalization
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID_SIZE = (8, 8)

# Denoising strength (h parameter for cv2.fastNlMeansDenoisingColored)
DENOISE_H = 6
DENOISE_H_COLOR = 6

# ─────────────────────────────────────────────────────────────────────────────
# Vein extraction thresholds (Stage 5)
# ─────────────────────────────────────────────────────────────────────────────

# CLAHE for vein enhancement (typically stronger than preprocessing CLAHE)
VEIN_CLAHE_CLIP_LIMIT = 4.0
VEIN_CLAHE_TILE_GRID_SIZE = (8, 8)

# Adaptive threshold block size (must be odd) and offset constant
ADAPTIVE_THRESH_BLOCK_SIZE = 51
ADAPTIVE_THRESH_C = 10

# Frangi filter parameters (sigmas = range of vein widths to detect, in pixels)
FRANGI_SIGMAS = range(1, 6)
FRANGI_BETA1 = 0.5
FRANGI_BETA2 = 15.0
FRANGI_BLACK_RIDGES = True  # veins appear darker on backlit grayscale

# Minimum skeleton branch length (pixels) — prune shorter branches as noise
MIN_SKELETON_BRANCH_LENGTH = 15

# ─────────────────────────────────────────────────────────────────────────────
# Color / chlorosis thresholds (Stage 6 — feature extraction from front-lit)
# ─────────────────────────────────────────────────────────────────────────────

# HSV range defining "yellow / pale" pixels for yellow_pixel_ratio
# Widened to capture pale, desaturated yellow-green mottling (H up to 45, S down to 20, V down to 50)
YELLOW_HSV_LOWER = (15, 20, 50)
YELLOW_HSV_UPPER = (45, 255, 255)

# ─────────────────────────────────────────────────────────────────────────────
# Decision engine thresholds (Stage 8 — populated after Stage 7 calibration)
# ─────────────────────────────────────────────────────────────────────────────
# PRIMARY FACTORS (Color / Chlorosis)
# These factors independently trigger a NOT HEALTHY verdict.

# Yellow pixel ratio (fraction of leaf pixels in yellow HSV band)
# In healthy Hibiscus, natural variance stays under 5-8%. Chlorosis starts > 8%.
YELLOW_RATIO_DEFICIENT = 0.08

# Excess Green Index (ExG = 2G − R − B, normalized per pixel, then averaged)
# In natural daylight RGB photography, healthy leaves produce ExG in the 0.42-0.55 range.
# Values below 0.38 indicate severe chlorophyll degradation or pigment loss.
EXG_HEALTHY_LOW = 0.38

# Dark Green Color Index (DGCI, standard turfgrass/chlorophyll formula)
# Healthy Hibiscus rosa-sinensis has DGCI >= 0.58 (typically 0.62-0.72).
# Chlorotic or pale leaves drop below 0.58 (e.g. 0.35-0.52).
DGCI_HEALTHY_LOW = 0.58

# Interveinal contrast (difference in mean green between on-vein and off-vein regions)
# Healthy leaves have uniform green color across veins and lamina (< 25.0).
# Elevated contrast (>= 28.0) with chlorosis indicates interveinal chlorosis (Fe/Mg deficiency).
INTERVEINAL_CONTRAST_THRESHOLD = 28.0

# Color spatial variance (confound check for localized damage vs systemic deficiency)
# Healthy leaves have smooth lamina variance (< 350).
# Sharp localized spotting, pest bites, or necrotic patches exceed 500.
COLOR_SPATIAL_VARIANCE_MAX = 500.0

# ─────────────────────────────────────────────────────────────────────────────
# SECONDARY FACTORS (Vein Geometry)
# ─────────────────────────────────────────────────────────────────────────────
# These factors do NOT trigger a NOT HEALTHY verdict on their own. They are
# appended as supporting evidence if a primary color factor fails.

# Vein density (vein pixels / leaf area)
# Calibrated healthy baseline: ~0.040 - 0.055
VEIN_DENSITY_DEFICIENT = 0.040

# Vein thickness (average pixel width)
# Calibrated healthy baseline: ~6.5 - 7.8 px
VEIN_THICKNESS_DEFICIENT_HIGH = 8.10

# ─────────────────────────────────────────────────────────────────────────────
# Reporting thresholds (Stage 10)
# ─────────────────────────────────────────────────────────────────────────────

# Minimum area (in pixels) for a blob of flagged pixels to be circled
# Drops single-pixel noise from the "unhealthy regions" visualization
UNHEALTHY_REGION_MIN_AREA = 250
