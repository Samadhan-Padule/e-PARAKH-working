import json
import re
from typing import Any, Dict, Iterable, List, Optional

import requests
from bs4 import BeautifulSoup


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
}


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def _extract_price_value(raw_value: Any) -> Optional[float]:
    if raw_value is None:
        return None
    text = _normalize_text(raw_value)
    if not text:
        return None

    matches = re.findall(r"(?:₹|Rs\.?|INR|\bINR\b)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)|([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*(?:/-|/\-)", text, flags=re.IGNORECASE)
    numbers = []
    for group in matches:
        for candidate in group:
            if candidate:
                numbers.append(candidate.replace(",", ""))
    if not numbers:
        plain_numbers = re.findall(r"\b\d+(?:,\d{3})*(?:\.\d+)?\b", text)
        if not plain_numbers:
            return None
        numbers = [value.replace(",", "") for value in plain_numbers]

    try:
        return float(numbers[0])
    except (TypeError, ValueError):
        return None


def _find_mrp_from_soup(soup: BeautifulSoup) -> Optional[float]:
    candidates = []

    for selector in [
        '[data-testid="price"]',
        '.price',
        '.pprice',
        '.a-price-whole',
        '#priceblock_ourprice',
        '[class*="price"]',
        '[id*="price"]',
    ]:
        for element in soup.select(selector):
            candidates.append(element.get_text(" ", strip=True))

    for element in soup.find_all(string=re.compile(r"(MRP|Maximum Retail Price|Price|₹|Rs)", re.IGNORECASE)):
        if element and isinstance(element, str):
            candidates.append(element)

    for candidate in candidates:
        price = _extract_price_value(candidate)
        if price is not None:
            return price

    for meta in soup.select('meta[itemprop="price"]'):
        price = _extract_price_value(meta.get("content"))
        if price is not None:
            return price

    return None


def _extract_image_urls(soup: BeautifulSoup) -> List[str]:
    urls = []
    seen = set()

    for tag in soup.select('img[src]'):
        src = tag.get("src") or tag.get("data-src") or tag.get("data-srcset")
        if not src:
            continue
        clean = src.split(" ", 1)[0].strip()
        if clean.startswith("//"):
            clean = "https:" + clean
        if clean.startswith("http") and clean not in seen:
            seen.add(clean)
            urls.append(clean)

    for meta in soup.select('meta[property="og:image"]'):
        content = meta.get("content")
        if content and content.startswith("http") and content not in seen:
            seen.add(content)
            urls.append(content)

    return urls[:10]


def _extract_title_from_soup(soup: BeautifulSoup) -> str:
    for tag in [
        soup.select_one('meta[property="og:title"]'),
        soup.select_one('meta[name="title"]'),
        soup.select_one('title'),
        soup.select_one('h1'),
    ]:
        if tag is not None:
            title = _normalize_text(tag.get("content") or tag.get_text(" ", strip=True))
            if title:
                return title

    for selector in ['#productTitle', '.B_NuCI', '[data-testid="product-title"]', '.title']:
        el = soup.select_one(selector)
        if el is not None:
            title = _normalize_text(el.get_text(" ", strip=True))
            if title:
                return title
    return ""


def crawl_product_details(url: str) -> Dict[str, Any]:
    response = requests.get(url, headers=DEFAULT_HEADERS, timeout=20)
    response.raise_for_status()

    html = response.text
    soup = BeautifulSoup(html, "html.parser")

    title = _extract_title_from_soup(soup)
    mrp = _find_mrp_from_soup(soup)
    image_urls = _extract_image_urls(soup)
    lower_url = (url or "").lower()

    source = "generic"
    if "amazon" in lower_url:
        source = "amazon"
    elif "flipkart" in lower_url:
        source = "flipkart"
    elif "blinkit" in lower_url:
        source = "blinkit"
    elif "zepto" in lower_url:
        source = "zepto"
    elif "swiggy" in lower_url or "instamart" in lower_url:
        source = "swiggy_instamart"

    return {
        "source": source,
        "url": url,
        "title": title,
        "mrp": mrp,
        "mrp_display": f"₹ {mrp:.2f}" if mrp is not None else None,
        "image_urls": image_urls,
        "availability": "unknown",
        "raw_html_length": len(html),
    }


def compare_product_metadata_to_ocr(
    online_metadata: Optional[Dict[str, Any]],
    physical_label_metadata: Optional[Dict[str, Any]],
    tolerance_percent: float = 8.0,
) -> Dict[str, Any]:
    if not online_metadata:
        return {
            "status": "not_checked",
            "rule": "Rule 6(10)",
            "message": "No product metadata was returned from the e-commerce page.",
        }

    online_mrp = online_metadata.get("mrp")
    if online_mrp is None:
        return {
            "status": "not_checked",
            "rule": "Rule 6(10)",
            "message": "No valid MRP value was found in the online listing.",
        }

    if not physical_label_metadata:
        return {
            "status": "not_checked",
            "rule": "Rule 6(10)",
            "message": "No physical OCR metadata was supplied for comparison.",
        }

    physical_mrp = None
    for key in ["mrp", "maximum_retail_price", "max_retail_price", "price", "label_mrp"]:
        value = physical_label_metadata.get(key)
        if value is None:
            continue
        if isinstance(value, (int, float)):
            physical_mrp = float(value)
            break
        if isinstance(value, str):
            parsed = _extract_price_value(value)
            if parsed is not None:
                physical_mrp = parsed
                break

    if physical_mrp is None:
        return {
            "status": "not_checked",
            "rule": "Rule 6(10)",
            "message": "Physical package MRP could not be parsed from OCR metadata.",
        }

    difference = abs(online_mrp - physical_mrp)
    percent_gap = (difference / online_mrp) * 100 if online_mrp else 0.0

    if percent_gap > tolerance_percent:
        return {
            "status": "violation",
            "rule": "Rule 6(10)",
            "message": (
                "E-commerce listing MRP and physical package declaration differ materially; "
                "this may constitute a declaration disparity violation."
            ),
            "online_mrp": online_mrp,
            "physical_mrp": physical_mrp,
            "difference_percent": round(percent_gap, 2),
            "threshold_percent": tolerance_percent,
        }

    return {
        "status": "compliant",
        "rule": "Rule 6(10)",
        "message": "Online and physical MRP values are within tolerance.",
        "online_mrp": online_mrp,
        "physical_mrp": physical_mrp,
        "difference_percent": round(percent_gap, 2),
        "threshold_percent": tolerance_percent,
    }


__all__ = ["crawl_product_details", "compare_product_metadata_to_ocr"]
