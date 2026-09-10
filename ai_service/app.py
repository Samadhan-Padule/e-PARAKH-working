import os

# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

# Disable PaddlePaddle MKL-DNN / oneDNN by default.
# This avoids the lib/PIR oneDNN runtime issue seen during
# Railway inference.
os.environ["PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT"] = "0"

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from paddleocr import PaddleOCR

from extraction.declaration_extractor import extract_declarations
from compliance.rule_engine import validate_extracted_data
from vision.image_analyzer import analyze_image as analyze_vision
from vision.placement_analyzer import analyze_placement
from reports.report_service import generate_report


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------
# Allow:
# 1. Local frontend during development
# 2. Production Vercel frontend
# ------------------------------------------------------------

ALLOWED_ORIGINS = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://e-parakh-working.vercel.app",
]

CORS(
    app,
    resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS
        }
    }
)


# ============================================================
# UPLOAD CONFIGURATION
# ============================================================

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# ============================================================
# PADDLE OCR INITIALIZATION
# ============================================================

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    text_det_limit_side_len=960,
    text_det_limit_type="max",
    text_det_thresh=0.3,
    text_det_box_thresh=0.5,
    text_rec_score_thresh=0.5
)


# ============================================================
# OCR HELPERS
# ============================================================

def _bbox_from_polygon(polygon):
    """
    Convert PaddleOCR polygon coordinates into:

    [x1, y1, x2, y2]
    """

    if polygon is None:
        return None

    if hasattr(polygon, "tolist"):
        polygon = polygon.tolist()

    if not polygon:
        return None

    points = (
        polygon
        if isinstance(polygon[0], (list, tuple))
        else None
    )

    if not points:
        return None

    if not all(
        len(point) >= 2
        for point in points
    ):
        return None

    xs = [
        float(point[0])
        for point in points
    ]

    ys = [
        float(point[1])
        for point in points
    ]

    return [
        round(min(xs), 2),
        round(min(ys), 2),
        round(max(xs), 2),
        round(max(ys), 2)
    ]


def run_ocr_detections(image_path):
    """
    Run PaddleOCR and return structured detections.
    """

    result = ocr.predict(
        image_path
    )

    detections = []

    for res in result:

        data = res.json

        if not isinstance(data, dict):
            continue

        ocr_data = data.get(
            "res",
            data
        )

        if not isinstance(
            ocr_data,
            dict
        ):
            continue

        texts = ocr_data.get(
            "rec_texts",
            []
        )

        scores = ocr_data.get(
            "rec_scores",
            []
        )

        polygons = ocr_data.get(
            "rec_polys",
            ocr_data.get(
                "dt_polys",
                []
            )
        )

        for index, text in enumerate(texts):

            if not text:
                continue

            text = str(
                text
            ).strip()

            if not text:
                continue

            score = (
                scores[index]
                if index < len(scores)
                else None
            )

            polygon = (
                polygons[index]
                if index < len(polygons)
                else None
            )

            detections.append({

                "text": text,

                "confidence": (
                    round(
                        float(score),
                        4
                    )
                    if score is not None
                    else None
                ),

                "bbox": _bbox_from_polygon(
                    polygon
                )
            })

    return detections


def run_ocr(image_path):
    """
    Return only OCR text.
    """

    return [
        item["text"]
        for item in run_ocr_detections(
            image_path
        )
    ]


# ============================================================
# COMPLETE IMAGE ANALYSIS PIPELINE
# ============================================================

def analyze_image(image_path):
    """
    Complete e-PARAKH AI pipeline:

    1. OCR
    2. Raw OCR text
    3. Declaration extraction
    4. Vision analysis
    5. Placement analysis
    6. Compliance validation
    """

    # --------------------------------------------------------
    # 1. OCR
    # --------------------------------------------------------

    detections = run_ocr_detections(
        image_path
    )

    # --------------------------------------------------------
    # 2. RAW OCR TEXT
    # --------------------------------------------------------

    raw_ocr_text = "\n".join(
        item["text"]
        for item in detections
    )

    # --------------------------------------------------------
    # 3. EXTRACT DECLARATIONS
    # --------------------------------------------------------

    extracted_data = extract_declarations(
        raw_ocr_text
    )

    # --------------------------------------------------------
    # 4. VISION ANALYSIS
    # --------------------------------------------------------

    vision_analysis = analyze_vision(
        image_path,
        detections,
        extracted_data
    )

    # --------------------------------------------------------
    # 5. PLACEMENT ANALYSIS
    # --------------------------------------------------------

    placement, evidence = analyze_placement(
        detections,
        extracted_data,
        vision_analysis["image_quality"]
    )

    vision_analysis["placement"] = placement

    # --------------------------------------------------------
    # 6. COMPLIANCE VALIDATION
    # --------------------------------------------------------

    compliance_result = validate_extracted_data(
        extracted_data
    )

    return (
        raw_ocr_text,
        extracted_data,
        vision_analysis,
        evidence,
        compliance_result
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status": "success",

        "service": (
            "e-PARAKH AI OCR Service"
        ),

        "ocr": "PaddleOCR",

        "reporting": "enabled"

    }), 200


# ============================================================
# OCR API
# ============================================================

@app.route(
    "/ocr",
    methods=["POST"]
)
def ocr_image():

    if "image" not in request.files:

        return jsonify({

            "status": "error",

            "message": (
                "No image uploaded"
            )

        }), 400

    image = request.files["image"]

    if not image.filename:

        return jsonify({

            "status": "error",

            "message": (
                "No image selected"
            )

        }), 400

    # --------------------------------------------------------
    # Secure filename
    # --------------------------------------------------------

    filename = secure_filename(
        image.filename
    )

    if not filename:

        return jsonify({

            "status": "error",

            "message": (
                "Invalid image filename"
            )

        }), 400

    image_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    image.save(
        image_path
    )

    try:

        extracted_text = run_ocr(
            image_path
        )

        return jsonify({

            "status": "success",

            "filename": filename,

            "text": extracted_text

        }), 200

    except Exception as e:

        app.logger.exception(
            "OCR API failed"
        )

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 500

    finally:

        if os.path.exists(
            image_path
        ):

            os.remove(
                image_path
            )


# ============================================================
# COMPLETE ANALYSIS API
# + AUTOMATIC REPORT GENERATION
# ============================================================

@app.route(
    "/analyze",
    methods=["POST"]
)
def analyze_image_route():

    # --------------------------------------------------------
    # Validate uploaded image
    # --------------------------------------------------------

    if "image" not in request.files:

        return jsonify({

            "status": "error",

            "message": (
                "No image uploaded"
            )

        }), 400

    image = request.files["image"]

    if not image.filename:

        return jsonify({

            "status": "error",

            "message": (
                "No image selected"
            )

        }), 400

    # --------------------------------------------------------
    # Secure filename
    # --------------------------------------------------------

    filename = secure_filename(
        image.filename
    )

    if not filename:

        return jsonify({

            "status": "error",

            "message": (
                "Invalid image filename"
            )

        }), 400

    image_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    # --------------------------------------------------------
    # Save uploaded image
    # --------------------------------------------------------

    image.save(
        image_path
    )

    try:

        app.logger.info(
            "Starting analysis for %s",
            filename
        )

        # ====================================================
        # 1. COMPLETE AI ANALYSIS
        # ====================================================

        (
            raw_ocr_text,
            extracted_data,
            vision_analysis,
            evidence,
            compliance_result
        ) = analyze_image(
            image_path
        )

        app.logger.info(
            "OCR and compliance analysis completed for %s",
            filename
        )

        # ====================================================
        # 2. GENERATE HTML + PDF REPORT
        # ====================================================

        report = generate_report(

            photograph_reference=(
                filename
            ),

            ocr_text=(
                raw_ocr_text
            ),

            declarations=(
                extracted_data
            ),

            compliance=(
                compliance_result
            ),

            vision_summary=(
                vision_analysis
            ),

            evidence=(
                evidence
            ),

            remarks=(
                "Generated automatically by "
                "e-PARAKH AI Compliance System. "
                "Human verification is required "
                "before taking regulatory action."
            )
        )

        app.logger.info(
            "Report generated successfully for %s",
            filename
        )

        # ====================================================
        # 3. RETURN COMPLETE RESPONSE
        # ====================================================

        return jsonify({

            "status": "success",

            "filename": filename,

            # ------------------------------------------------
            # OCR
            # ------------------------------------------------

            "raw_ocr_text": (
                raw_ocr_text
            ),

            # ------------------------------------------------
            # Extracted declarations
            # ------------------------------------------------

            "extracted_data": (
                extracted_data
            ),

            "product": (
                extracted_data
            ),

            # ------------------------------------------------
            # Vision
            # ------------------------------------------------

            "vision_analysis": (
                vision_analysis
            ),

            # ------------------------------------------------
            # Evidence
            # ------------------------------------------------

            "evidence": (
                evidence
            ),

            # ------------------------------------------------
            # Compliance
            # ------------------------------------------------

            "compliance_result": (
                compliance_result
            ),

            # ------------------------------------------------
            # Report
            # ------------------------------------------------

            "report": report

        }), 200

    except Exception as e:

        # IMPORTANT:
        # This makes the actual runtime exception visible
        # in Railway logs.

        app.logger.exception(
            "Complete analysis API failed"
        )

        return jsonify({

            "status": "error",

            "message": (
                "Unable to analyze the uploaded image."
            ),

            "error": str(e)

        }), 500

    finally:

        # ----------------------------------------------------
        # Always remove temporary uploaded image
        # ----------------------------------------------------

        if os.path.exists(
            image_path
        ):

            os.remove(
                image_path
            )


# ============================================================
# REPORT GENERATION API
# ============================================================

@app.route(
    "/report",
    methods=["POST"]
)
def generate_report_route():

    try:

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        # ----------------------------------------------------
        # Photograph reference
        # ----------------------------------------------------

        photograph_reference = data.get(
            "photograph_reference",
            data.get(
                "filename",
                "N/A"
            )
        )

        # ----------------------------------------------------
        # OCR text
        # ----------------------------------------------------

        ocr_text = data.get(
            "raw_ocr_text",
            data.get(
                "ocr_text",
                ""
            )
        )

        # ----------------------------------------------------
        # Declarations
        # ----------------------------------------------------

        declarations = data.get(
            "declarations",
            data.get(
                "extracted_data",
                {}
            )
        )

        # ----------------------------------------------------
        # Compliance
        # ----------------------------------------------------

        compliance = data.get(
            "compliance",
            data.get(
                "compliance_result",
                {}
            )
        )

        # ----------------------------------------------------
        # Vision
        # ----------------------------------------------------

        vision_summary = data.get(
            "vision_summary",
            data.get(
                "vision_analysis",
                {}
            )
        )

        # ----------------------------------------------------
        # Evidence
        # ----------------------------------------------------

        evidence = data.get(
            "evidence",
            {}
        )

        # ----------------------------------------------------
        # Remarks
        # ----------------------------------------------------

        remarks = data.get(
            "remarks",
            ""
        )

        # ====================================================
        # Generate report
        # ====================================================

        report = generate_report(

            photograph_reference=(
                photograph_reference
            ),

            ocr_text=(
                ocr_text
            ),

            declarations=(
                declarations
            ),

            compliance=(
                compliance
            ),

            vision_summary=(
                vision_summary
            ),

            evidence=(
                evidence
            ),

            remarks=(
                remarks
            )
        )

        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return jsonify({

            "status": "success",

            "message": (
                "Compliance report "
                "generated successfully."
            ),

            "report": report

        }), 201

    except Exception as e:

        app.logger.exception(
            "Report generation API failed"
        )

        return jsonify({

            "status": "error",

            "message": (
                "Unable to generate report."
            ),

            "error": str(e)

        }), 500


# ============================================================
# APPLICATION START
# ============================================================

if __name__ == "__main__":

    # Railway provides PORT automatically.
    # Local development falls back to 8000.

    port = int(
        os.environ.get(
            "PORT",
            8000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )