from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import os

from extraction.declaration_extractor import extract_declarations
from compliance.rule_engine import validate_extracted_data
from vision.image_analyzer import analyze_image as analyze_vision
from vision.placement_analyzer import analyze_placement
from reports.report_service import generate_report
app = Flask(__name__)

CORS(app)



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
    if polygon is None:
        return None

    if hasattr(polygon, "tolist"):
        polygon = polygon.tolist()

    if not polygon:
        return None

    points = polygon if isinstance(polygon[0], (list, tuple)) else None

    if not points or not all(len(point) >= 2 for point in points):
        return None

    xs = [float(point[0]) for point in points]
    ys = [float(point[1]) for point in points]

    return [
        round(min(xs), 2),
        round(min(ys), 2),
        round(max(xs), 2),
        round(max(ys), 2)
    ]


def run_ocr_detections(image_path):
    result = ocr.predict(image_path)

    detections = []

    for res in result:

        data = res.json

        if isinstance(data, dict):

            ocr_data = data.get("res", data)

            texts = ocr_data.get("rec_texts", [])
            scores = ocr_data.get("rec_scores", [])

            polygons = ocr_data.get(
                "rec_polys",
                ocr_data.get("dt_polys", [])
            )

            for index, text in enumerate(texts):

                if not text or not str(text).strip():
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
                    "text": str(text).strip(),
                    "confidence": (
                        round(float(score), 4)
                        if score is not None
                        else None
                    ),
                    "bbox": _bbox_from_polygon(polygon)
                })

    return detections


def run_ocr(image_path):
    return [
        item["text"]
        for item in run_ocr_detections(image_path)
    ]


# ============================================================
# COMPLETE IMAGE ANALYSIS PIPELINE
# ============================================================

def analyze_image(image_path):

    # 1. OCR
    detections = run_ocr_detections(image_path)

    # 2. Raw OCR text
    raw_ocr_text = "\n".join(
        item["text"]
        for item in detections
    )

    # 3. Extract declarations
    extracted_data = extract_declarations(
        raw_ocr_text
    )

    # 4. Vision analysis
    vision_analysis = analyze_vision(
        image_path,
        detections,
        extracted_data
    )

    # 5. Placement analysis
    placement, evidence = analyze_placement(
        detections,
        extracted_data,
        vision_analysis["image_quality"]
    )

    vision_analysis["placement"] = placement

    # 6. Compliance validation
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

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "service": "e-PARAKH AI OCR Service",
        "ocr": "PaddleOCR",
        "reporting": "enabled"
    })


# ============================================================
# OCR API
# ============================================================

@app.route("/ocr", methods=["POST"])
def ocr_image():

    if "image" not in request.files:

        return jsonify({
            "status": "error",
            "message": "No image uploaded"
        }), 400

    image = request.files["image"]

    if image.filename == "":

        return jsonify({
            "status": "error",
            "message": "No image selected"
        }), 400

    upload_dir = os.path.join("uploads")

    os.makedirs(
        upload_dir,
        exist_ok=True
    )

    image_path = os.path.join(
        upload_dir,
        image.filename
    )

    image.save(image_path)

    try:

        extracted_text = run_ocr(
            image_path
        )

        return jsonify({
            "status": "success",
            "filename": image.filename,
            "text": extracted_text
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if os.path.exists(image_path):
            os.remove(image_path)


# ============================================================
# COMPLETE ANALYSIS API
# ============================================================

# ============================================================
# COMPLETE ANALYSIS API + AUTOMATIC REPORT GENERATION
# ============================================================

@app.route("/analyze", methods=["POST"])
def analyze_image_route():

    if "image" not in request.files:
        return jsonify({
            "status": "error",
            "message": "No image uploaded"
        }), 400

    image = request.files["image"]

    if image.filename == "":
        return jsonify({
            "status": "error",
            "message": "No image selected"
        }), 400

    upload_dir = os.path.join("uploads")
    os.makedirs(upload_dir, exist_ok=True)

    image_path = os.path.join(
        upload_dir,
        image.filename
    )

    image.save(image_path)

    try:

        # ----------------------------------------------------
        # 1. COMPLETE AI ANALYSIS
        # ----------------------------------------------------

        (
            raw_ocr_text,
            extracted_data,
            vision_analysis,
            evidence,
            compliance_result
        ) = analyze_image(image_path)


        # ----------------------------------------------------
        # 2. GENERATE HTML + PDF REPORT
        # ----------------------------------------------------

        report = generate_report(

            photograph_reference=image.filename,

            ocr_text=raw_ocr_text,

            declarations=extracted_data,

            compliance=compliance_result,

            vision_summary=vision_analysis,

            evidence=evidence,

            remarks=(
                "Generated automatically by "
                "e-PARAKH AI Compliance System. "
                "Human verification is required "
                "before taking regulatory action."
            )
        )


        # ----------------------------------------------------
        # 3. RETURN COMPLETE RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "status": "success",

            "filename": image.filename,

            # OCR
            "raw_ocr_text": raw_ocr_text,

            # Extracted declarations
            "extracted_data": extracted_data,

            "product": extracted_data,

            # Vision
            "vision_analysis": vision_analysis,

            # Evidence
            "evidence": evidence,

            # Compliance
            "compliance_result": compliance_result,

            # Report
            "report": report

        }), 200


    except Exception as e:

        return jsonify({

            "status": "error",

            "message": "Unable to analyze the uploaded image.",

            "error": str(e)

        }), 500


    finally:

        if os.path.exists(image_path):
            os.remove(image_path)
# ============================================================
# REPORT GENERATION API
# ============================================================

@app.route("/report", methods=["POST"])
def generate_report_route():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        # ----------------------------------------------------
        # Extract data received from frontend / analyze API
        # ----------------------------------------------------

        photograph_reference = data.get(
            "photograph_reference",
            data.get(
                "filename",
                "N/A"
            )
        )

        ocr_text = data.get(
            "raw_ocr_text",
            data.get(
                "ocr_text",
                ""
            )
        )

        declarations = data.get(
            "declarations",
            data.get(
                "extracted_data",
                {}
            )
        )

        compliance = data.get(
            "compliance",
            data.get(
                "compliance_result",
                {}
            )
        )

        vision_summary = data.get(
            "vision_summary",
            data.get(
                "vision_analysis",
                {}
            )
        )

        evidence = data.get(
            "evidence",
            {}
        )

        remarks = data.get(
            "remarks",
            ""
        )

        # ----------------------------------------------------
        # Generate HTML + PDF report
        # ----------------------------------------------------

        report = generate_report(

            photograph_reference=(
                photograph_reference
            ),

            ocr_text=ocr_text,

            declarations=declarations,

            compliance=compliance,

            vision_summary=vision_summary,

            evidence=evidence,

            remarks=remarks
        )

        # ----------------------------------------------------
        # Success response
        # ----------------------------------------------------

        return jsonify({

            "status": "success",

            "message": (
                "Compliance report "
                "generated successfully."
            ),

            "report": report

        }), 201

    except Exception as e:

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

    app.run(

        host="0.0.0.0",

        port=8000,

        debug=True

    )