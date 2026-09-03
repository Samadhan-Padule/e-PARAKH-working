import json
from pathlib import Path

import requests

BASE_URL = "http://127.0.0.1:8000"


def print_json(label: str, payload: dict):
    print(f"\n=== {label} ===")
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def test_health():
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=30)
        print_json("GET /health", response.json())
    except Exception as exc:
        print_json("GET /health ERROR", {"status": "error", "message": str(exc)})


def test_ecommerce_pdp():
    body = {
        "url": "https://www.amazon.in/s?k=dettol+soap",
        "physical_label": {
            "mrp": 55,
            "price": 55,
            "maximum_retail_price": 55,
        },
    }
    try:
        response = requests.post(
            f"{BASE_URL}/api/scan/ecommerce-pdp",
            json=body,
            timeout=60,
        )
        print_json("POST /api/scan/ecommerce-pdp", response.json())
    except Exception as exc:
        print_json("POST /api/scan/ecommerce-pdp ERROR", {"status": "error", "message": str(exc)})


def test_multi_panel():
    files_dir = Path(__file__).resolve().parent / "test-images"
    candidates = [
        files_dir / "detol.demo.jpeg",
        files_dir / "correct.jpeg",
    ]
    valid_files = [p for p in candidates if p.exists()]

    if not valid_files:
        print_json("POST /api/scan/multi-panel", {"status": "error", "message": "No test images found in ai_service/test-images"})
        return

    try:
        files = []
        for file_path in valid_files:
            files.append(("images", (file_path.name, open(file_path, "rb"), "image/jpeg")))

        response = requests.post(
            f"{BASE_URL}/api/scan/multi-panel",
            files=files,
            timeout=10,
        )
        print_json("POST /api/scan/multi-panel", response.json())
    except Exception as exc:
        print_json("POST /api/scan/multi-panel ERROR", {"status": "error", "message": str(exc)})


if __name__ == "__main__":
    print("Testing AI Service endpoints at:", BASE_URL)
    test_health()
    test_ecommerce_pdp()
    test_multi_panel()
