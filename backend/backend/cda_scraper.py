from datetime import datetime, timedelta
import io
import json
import os
import re
import pdfplumber
import requests

DATA_FILE = os.path.join(os.path.dirname(__file__), "cda_rates.json")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

FALLBACK_DATA = {
    "last_updated": "2026-08-25",
    "fresh_coconut": {
        "wholesale_large": {"min": 140.0, "max": 150.0},
        "retail_large": {"min": 160.0, "max": 190.0},
    },
    "farm_gate_price_per_1000": {
        "Kurunegala": {"min": 100000, "max": 110000},
        "Puttalam": {"min": 100000, "max": 115000},
        "Gampaha": {"min": 100000, "max": 110000},
        "Hambanthota": {"min": 100000, "max": 110000},
    },
    "coconut_oil_wholesale_per_mt": {"min": 800000, "max": 875000},
    "status": "fallback",
}

def parse_price_range(range_str: str):
    """Parses '100,000 - 110,000' or '140.00-150.00' into a dict of floats."""
    clean = range_str.replace(",", "").strip()
    match = re.search(r"(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)", clean)
    if match:
        return {"min": float(match.group(1)), "max": float(match.group(2))}
    return None

def fetch_cda_pdf(target_date: datetime):
    """Attempts to download the PDF for a specific date."""
    year_str = target_date.strftime("%Y")
    month_str = target_date.strftime("%b").upper()
    date_str = target_date.strftime("%Y.%m.%d")
    url = (
        f"https://www.cda.gov.lk/web/images/pdf/MARKET_DETAILS/"
        f"{year_str}/{month_str}/{date_str}.xlsx_web.pdf"
    )
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200 and len(response.content) > 1000:
            return response.content, target_date.strftime("%Y-%m-%d")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
    return None, None

def extract_data_from_pdf(pdf_bytes: bytes, date_str: str):
    """Extracts Farm Gate and Market rates using pdfplumber."""
    extracted = {
        "last_updated": date_str,
        "fresh_coconut": {},
        "farm_gate_per_nut": {},
        "national_average_per_nut": 116.70, # Fallback Default
        "coconut_oil_wholesale_per_mt": {},
        "status": "live",
    }
    
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = pdf.pages[0].extract_text()
        
        # 1. Auction Average Price (National Average) Extract
        auction_match = re.search(r"Average Price \(Ex-\s*Husked Nuts\)\s*\(Rs\./1,000 Nuts\)\s*([\d,]+\.?\d*)", text, re.IGNORECASE)
        if not auction_match:
             auction_match = re.search(r"Average Price.*?([\d,]{5,}\.\d{2})", text, re.DOTALL | re.IGNORECASE)
             
        if auction_match:
            try:
                avg_1000 = float(auction_match.group(1).replace(",", ""))
                if avg_1000 > 0:
                    extracted["national_average_per_nut"] = round(avg_1000 / 1000.0, 2)
            except:
                pass
                
        # Failsafe fallback
        if extracted.get("national_average_per_nut", 0) <= 0:
            extracted["national_average_per_nut"] = 116.70
                
        # 2. Parse Farm Gate Rates (Kurunegala, Puttalam, Gampaha, Hambanthota)
        districts = ["Kurunegala", "Puttalam", "Gampaha", "Hambanthota"]
        for dist in districts:
            pattern = rf"{dist}\s+([\d,]+\s*-\s*[\d,]+)"
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                prices = parse_price_range(match.group(1))
                if prices:
                    extracted["farm_gate_per_nut"][dist] = {
                        "min": round(prices["min"] / 1000.0, 2),
                        "max": round(prices["max"] / 1000.0, 2)
                    }
                    
        # Parse Fresh Coconut Wholesale / Retail
        ws_match = re.search(r"Wholesale\s+([\d\.]+)\s*-\s*([\d\.]+)", text)
        if ws_match:
            extracted["fresh_coconut"]["wholesale_large"] = {
                "min": float(ws_match.group(1)),
                "max": float(ws_match.group(2)),
            }
        rt_match = re.search(r"Retail\s+([\d\.]+)\s*-\s*([\d\.]+)", text)
        if rt_match:
            extracted["fresh_coconut"]["retail_large"] = {
                "min": float(rt_match.group(1)),
                "max": float(rt_match.group(2)),
            }
            
        # Parse Coconut Oil
        oil_match = re.search(
            r"Coconut Oil - Local Wholesale Price.*?([\d,]+\s*-\s*[\d,]+)", text, re.DOTALL,
        )
        if oil_match:
            prices = parse_price_range(oil_match.group(1))
            if prices:
                extracted["coconut_oil_wholesale_per_mt"] = prices
                
        if not extracted["farm_gate_per_nut"]:
            raise ValueError("Failed to parse Farm Gate prices from text.")
            
        return extracted

def scrape_and_update():
    """Tries the last 7 days to find the latest published PDF bulletin."""
    today = datetime.now()
    pdf_bytes, valid_date = None, None
    for i in range(7):
        check_date = today - timedelta(days=i)
        pdf_bytes, valid_date = fetch_cda_pdf(check_date)
        if pdf_bytes:
            print(f"Found published CDA bulletin for {valid_date}")
            break
            
    data_to_save = None
    if pdf_bytes:
        try:
            data_to_save = extract_data_from_pdf(pdf_bytes, valid_date)
        except Exception as e:
            print(f"Failed to parse PDF text: {e}")
            
    if not data_to_save:
        print("Using fallback dataset.")
        data_to_save = FALLBACK_DATA
        
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data_to_save, f, indent=2)
        
    print(f"Rates successfully saved to {DATA_FILE}")

if __name__ == "__main__":
    scrape_and_update()