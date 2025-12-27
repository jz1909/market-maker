"""
Fetches World Bank data and exports questions to JSON for database import.

Usage:
    python scripts/export_questions.py
    python scripts/export_questions.py --output custom_output.json
"""

import json
import argparse
from datetime import datetime, timezone
from typing import Dict, Any, List
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Full list of country codes
COUNTRIES = [
    "AFG", "ALB", "DZA", "ASM", "AND", "AGO", "ATG", "ARG", "ARM", "ABW", "AUS", "AUT", "AZE",
    "BHS", "BHR", "BGD", "BRB", "BLR", "BEL", "BLZ", "BEN", "BMU", "BTN", "BOL", "BIH", "BWA",
    "BRA", "BRN", "BGR", "BFA", "BDI", "KHM", "CMR", "CAN", "CPV", "CAF", "TCD", "CHL", "CHN",
    "COL", "COM", "COG", "COD", "CRI", "CIV", "HRV", "CUB", "CYP", "CZE", "DNK", "DJI", "DMA",
    "DOM", "ECU", "EGY", "SLV", "GNQ", "ERI", "EST", "SWZ", "ETH", "FJI", "FIN", "FRA", "GAB",
    "GMB", "GEO", "DEU", "GHA", "GRC", "GRD", "GTM", "GIN", "GNB", "GUY", "HTI", "HND", "HUN",
    "ISL", "IND", "IDN", "IRN", "IRQ", "IRL", "ISR", "ITA", "JAM", "JPN", "JOR", "KAZ", "KEN",
    "KIR", "PRK", "KOR", "KWT", "KGZ", "LAO", "LVA", "LBN", "LSO", "LBR", "LBY", "LIE", "LTU",
    "LUX", "MDG", "MWI", "MYS", "MDV", "MLI", "MLT", "MHL", "MRT", "MUS", "MEX", "FSM", "MDA",
    "MCO", "MNG", "MNE", "MAR", "MOZ", "MMR", "NAM", "NRU", "NPL", "NLD", "NZL", "NIC", "NER",
    "NGA", "MKD", "NOR", "OMN", "PAK", "PLW", "PAN", "PNG", "PRY", "PER", "PHL", "POL", "PRT",
    "QAT", "ROU", "RUS", "RWA", "KNA", "LCA", "VCT", "WSM", "SMR", "STP", "SAU", "SEN", "SRB",
    "SYC", "SLE", "SGP", "SVK", "SVN", "SLB", "SOM", "ZAF", "SSD", "ESP", "LKA", "SDN", "SUR",
    "SWE", "CHE", "SYR", "TJK", "TZA", "THA", "TLS", "TGO", "TON", "TTO", "TUN", "TUR", "TKM",
    "TUV", "UGA", "UKR", "ARE", "GBR", "USA", "URY", "UZB", "VUT", "VEN", "VNM", "YEM",
    "ZMB", "ZWE"
]

COUNTRY_NAMES = {
    "AFG": "Afghanistan", "ALB": "Albania", "DZA": "Algeria", "ASM": "American Samoa",
    "AND": "Andorra", "AGO": "Angola", "ATG": "Antigua and Barbuda", "ARG": "Argentina",
    "ARM": "Armenia", "ABW": "Aruba", "AUS": "Australia", "AUT": "Austria", "AZE": "Azerbaijan",
    "BHS": "Bahamas", "BHR": "Bahrain", "BGD": "Bangladesh", "BRB": "Barbados", "BLR": "Belarus",
    "BEL": "Belgium", "BLZ": "Belize", "BEN": "Benin", "BMU": "Bermuda", "BTN": "Bhutan",
    "BOL": "Bolivia", "BIH": "Bosnia and Herzegovina", "BWA": "Botswana", "BRA": "Brazil",
    "BRN": "Brunei", "BGR": "Bulgaria", "BFA": "Burkina Faso", "BDI": "Burundi", "KHM": "Cambodia",
    "CMR": "Cameroon", "CAN": "Canada", "CPV": "Cabo Verde", "CAF": "Central African Republic",
    "TCD": "Chad", "CHL": "Chile", "CHN": "China", "COL": "Colombia", "COM": "Comoros",
    "COG": "Republic of the Congo", "COD": "Democratic Republic of the Congo", "CRI": "Costa Rica",
    "CIV": "Côte d'Ivoire", "HRV": "Croatia", "CUB": "Cuba", "CYP": "Cyprus", "CZE": "Czech Republic",
    "DNK": "Denmark", "DJI": "Djibouti", "DMA": "Dominica", "DOM": "Dominican Republic",
    "ECU": "Ecuador", "EGY": "Egypt", "SLV": "El Salvador", "GNQ": "Equatorial Guinea",
    "ERI": "Eritrea", "EST": "Estonia", "SWZ": "Eswatini", "ETH": "Ethiopia", "FJI": "Fiji",
    "FIN": "Finland", "FRA": "France", "GAB": "Gabon", "GMB": "Gambia", "GEO": "Georgia",
    "DEU": "Germany", "GHA": "Ghana", "GRC": "Greece", "GRD": "Grenada", "GTM": "Guatemala",
    "GIN": "Guinea", "GNB": "Guinea-Bissau", "GUY": "Guyana", "HTI": "Haiti", "HND": "Honduras",
    "HUN": "Hungary", "ISL": "Iceland", "IND": "India", "IDN": "Indonesia", "IRN": "Iran",
    "IRQ": "Iraq", "IRL": "Ireland", "ISR": "Israel", "ITA": "Italy", "JAM": "Jamaica",
    "JPN": "Japan", "JOR": "Jordan", "KAZ": "Kazakhstan", "KEN": "Kenya", "KIR": "Kiribati",
    "PRK": "North Korea", "KOR": "South Korea", "KWT": "Kuwait", "KGZ": "Kyrgyzstan", "LAO": "Laos",
    "LVA": "Latvia", "LBN": "Lebanon", "LSO": "Lesotho", "LBR": "Liberia", "LBY": "Libya",
    "LIE": "Liechtenstein", "LTU": "Lithuania", "LUX": "Luxembourg", "MDG": "Madagascar",
    "MWI": "Malawi", "MYS": "Malaysia", "MDV": "Maldives", "MLI": "Mali", "MLT": "Malta",
    "MHL": "Marshall Islands", "MRT": "Mauritania", "MUS": "Mauritius", "MEX": "Mexico",
    "FSM": "Micronesia", "MDA": "Moldova", "MCO": "Monaco", "MNG": "Mongolia", "MNE": "Montenegro",
    "MAR": "Morocco", "MOZ": "Mozambique", "MMR": "Myanmar", "NAM": "Namibia", "NRU": "Nauru",
    "NPL": "Nepal", "NLD": "Netherlands", "NZL": "New Zealand", "NIC": "Nicaragua", "NER": "Niger",
    "NGA": "Nigeria", "MKD": "North Macedonia", "NOR": "Norway", "OMN": "Oman", "PAK": "Pakistan",
    "PLW": "Palau", "PAN": "Panama", "PNG": "Papua New Guinea", "PRY": "Paraguay", "PER": "Peru",
    "PHL": "Philippines", "POL": "Poland", "PRT": "Portugal", "QAT": "Qatar", "ROU": "Romania",
    "RUS": "Russia", "RWA": "Rwanda", "KNA": "Saint Kitts and Nevis", "LCA": "Saint Lucia",
    "VCT": "Saint Vincent and the Grenadines", "WSM": "Samoa", "SMR": "San Marino",
    "STP": "São Tomé and Príncipe", "SAU": "Saudi Arabia", "SEN": "Senegal", "SRB": "Serbia",
    "SYC": "Seychelles", "SLE": "Sierra Leone", "SGP": "Singapore", "SVK": "Slovakia",
    "SVN": "Slovenia", "SLB": "Solomon Islands", "SOM": "Somalia", "ZAF": "South Africa",
    "SSD": "South Sudan", "ESP": "Spain", "LKA": "Sri Lanka", "SDN": "Sudan", "SUR": "Suriname",
    "SWE": "Sweden", "CHE": "Switzerland", "SYR": "Syria", "TJK": "Tajikistan", "TZA": "Tanzania",
    "THA": "Thailand", "TLS": "Timor-Leste", "TGO": "Togo", "TON": "Tonga",
    "TTO": "Trinidad and Tobago", "TUN": "Tunisia", "TUR": "Turkey", "TKM": "Turkmenistan",
    "TUV": "Tuvalu", "UGA": "Uganda", "UKR": "Ukraine", "ARE": "United Arab Emirates",
    "GBR": "United Kingdom", "USA": "United States", "URY": "Uruguay", "UZB": "Uzbekistan",
    "VUT": "Vanuatu", "VEN": "Venezuela", "VNM": "Vietnam", "YEM": "Yemen",
    "ZMB": "Zambia", "ZWE": "Zimbabwe"
}

YEARS = list(range(2020, 2025))

# World Bank indicator configurations
INDICATORS = [
    {
        "code": "SP.POP.TOTL",
        "prompt_template": "What was {country}'s population in {year}?",
        "unit": "people",
    },
    {
        "code": "NY.GDP.MKTP.CD",
        "prompt_template": "What was {country}'s GDP in {year}?",
        "unit": "dollars",
    },
    {
        "code": "SP.DYN.LE00.IN",
        "prompt_template": "What was {country}'s average life expectancy in {year}?",
        "unit": "years",
    },
    {
        "code": "IS.AIR.PSGR",
        "prompt_template": "What was {country}'s total passengers carried by airlines in {year}?",
        "unit": "people",
    },
    {
        "code": "IP.PAT.RESD",
        "prompt_template": "What was {country}'s total patents filed by residents in {year}?",
        "unit": "patents",
    },
]


def create_session() -> requests.Session:
    """Create a requests session with retry logic."""
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    session.mount("https://", HTTPAdapter(max_retries=retries))
    return session


def fetch_indicator(session: requests.Session, country: str, indicator_code: str) -> Dict[str, Any] | None:
    """Fetch World Bank indicator data for a country."""
    url = f"https://api.worldbank.org/v2/country/{country}/indicator/{indicator_code}?format=json"

    try:
        resp = session.get(url, timeout=(5, 20))
        resp.raise_for_status()
        data = resp.json()

        if data is None or len(data) < 2 or data[1] is None:
            return None

        return {
            "observations": data[1],
            "sourceUrl": url,
        }
    except Exception as e:
        print(f"  Error fetching {indicator_code} for {country}: {e}")
        return None


def process_indicator(
    session: requests.Session,
    indicator: Dict[str, str],
    countries: List[str],
    years: List[int]
) -> List[Dict[str, Any]]:
    """Process a single indicator across all countries and years."""
    questions: List[Dict[str, Any]] = []

    print(f"\nFetching {indicator['code']}...")

    for country in countries:
        result = fetch_indicator(session, country, indicator["code"])

        if result is None:
            continue

        country_name = COUNTRY_NAMES.get(country, country)
        print(f"  {country_name}")

        year_to_value = {
            int(obs["date"]): obs["value"]
            for obs in result["observations"]
            if obs["value"] is not None
        }

        for year in years:
            if year not in year_to_value:
                continue

            questions.append({
                "prompt": indicator["prompt_template"].format(country=country_name, year=year),
                "answer": year_to_value[year],
                "unit": indicator["unit"],
                "source": "World Bank Open Data (WDI API)",
                "year": year,
            })

    return questions


def main():
    parser = argparse.ArgumentParser(description="Export World Bank questions to JSON")
    parser.add_argument(
        "--output", "-o",
        default="scripts/questions.json",
        help="Output JSON file path (default: scripts/questions.json)"
    )
    parser.add_argument(
        "--countries",
        nargs="+",
        default=None,
        help="Specific country codes to fetch (default: all countries)"
    )
    args = parser.parse_args()

    countries = args.countries if args.countries else COUNTRIES
    session = create_session()

    all_questions: List[Dict[str, Any]] = []

    for indicator in INDICATORS:
        questions = process_indicator(session, indicator, countries, YEARS)
        all_questions.extend(questions)
        print(f"  Collected {len(questions)} questions for {indicator['code']}")

    # Write to JSON
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)

    print(f"\nExported {len(all_questions)} questions to {args.output}")


if __name__ == "__main__":
    main()