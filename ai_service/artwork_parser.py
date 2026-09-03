import io
from typing import Any, Dict, Iterable, List, Optional, Union

import fitz
import numpy as np
from PIL import Image


def _read_bytes(file_input: Any) -> bytes:
    if isinstance(file_input, (bytes, bytearray)):
        return bytes(file_input)
    if isinstance(file_input, str):
        with open(file_input, "rb") as handle:
            return handle.read()
    if hasattr(file_input, "read"):
        return file_input.read()
    raise TypeError("Unsupported artwork input type")


def render_artwork_pages_to_images(
    file_input: Any,
    dpi: int = 300,
) -> List[np.ndarray]:
    """
    Render a vector artwork / PDF page into memory as high-resolution RGB images.
    Accepts PDF bytes or a path to a PDF file, and returns a list of OpenCV-ready arrays.
    """
    payload = _read_bytes(file_input)
    if not payload:
        raise ValueError("Artwork input is empty")

    try:
        document = fitz.open(stream=payload, filetype="pdf")
    except Exception as exc:
        # Adobe Illustrator files are often PDF-compatible or exported as PDF; keep the API clear.
        raise ValueError(
            "Artwork could not be opened as a PDF-compatible document. Export as PDF before ingestion."
        ) from exc

    frames: List[np.ndarray] = []
    scale = dpi / 72.0

    for page_index in range(document.page_count):
        page = document.load_page(page_index)
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        frames.append(np.array(image))

    return frames


def artwork_to_ocr_frames(
    file_input: Any,
    dpi: int = 300,
) -> List[np.ndarray]:
    return render_artwork_pages_to_images(file_input=file_input, dpi=dpi)


__all__ = ["render_artwork_pages_to_images", "artwork_to_ocr_frames"]
