import requests
from bs4 import BeautifulSoup
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

url = "https://www.cda.gov.lk/web/index.php?option=com_content&view=article&id=16&Itemid=240&lang=en"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

try:
    response = requests.get(url, headers=headers, verify=False, timeout=15)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Dump all text to see what we got
    with open('cda_dump.txt', 'w', encoding='utf-8') as f:
        f.write(soup.text)
        
    print("Scraped successfully, saved to cda_dump.txt")
except Exception as e:
    print("Error:", e)
