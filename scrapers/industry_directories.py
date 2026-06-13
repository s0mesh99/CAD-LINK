from scrapers.base import BaseScraper

class IndustryDirectoriesScraper(BaseScraper):
    def __init__(self):
        super().__init__("industry_directories", "manual_seed", "engineering")
        
        # Curated from Power Technology, Mining Technology, and TradeIndia O&G
        self.directory_targets = [
            # ----- Power Technology / Energy EPC -----
            ("Siemens Energy", "siemens-energy.com", "energy", "power_plant", "Germany"),
            ("GE Vernova", "gevernova.com", "energy", "power_plant", "USA"),
            ("Mitsubishi Heavy Industries", "mhi.com", "energy", "power_plant", "Japan"),
            ("Hitachi Energy", "hitachienergy.com", "energy", "power_plant", "Switzerland"),
            ("Doosan Enerbility", "doosanenerbility.com", "energy", "power_plant", "South Korea"),
            ("Wärtsilä", "wartsila.com", "energy", "power_plant", "Finland"),
            ("Vestas", "vestas.com", "energy", "renewables", "Denmark"),
            ("Orsted", "orsted.com", "energy", "renewables", "Denmark"),
            ("NextEra Energy", "nexteraenergy.com", "energy", "renewables", "USA"),
            ("Iberdrola", "iberdrola.com", "energy", "renewables", "Spain"),
            ("Enel Green Power", "enelgreenpower.com", "energy", "renewables", "Italy"),
            
            # ----- Mining Technology EPC -----
            ("FLSmidth", "flsmidth.com", "epc", "mining", "Denmark"),
            ("Metso Outotec", "mogroup.com", "epc", "mining", "Finland"),
            ("Sandvik Mining and Rock Solutions", "rocktechnology.sandvik", "epc", "mining", "Sweden"),
            ("Epiroc", "epiroc.com", "epc", "mining", "Sweden"),
            ("Weir Group", "global.weir", "epc", "mining", "UK"),
            ("Outotec (now Metso)", "mogroup.com", "epc", "mining", "Finland"),
            ("Tenova", "tenova.com", "epc", "mining", "Italy"),
            ("DRA Global", "draglobal.com", "epc", "mining", "Australia"),
            ("Ausenco", "ausenco.com", "epc", "mining", "Australia"),
            ("Sedgman", "sedgman.com", "epc", "mining", "Australia"),
            ("Lycopodium", "lycopodium.com", "epc", "mining", "Australia"),
            ("Macmahon", "macmahon.com.au", "epc", "mining", "Australia"),
            ("Thiess", "thiess.com", "epc", "mining", "Australia"),
            
            # ----- TradeIndia O&G Equipment Manufacturers (India) -----
            ("Godrej Process Equipment", "godrej.com", "oil_gas", "equipment", "India"),
            ("L&T Heavy Engineering", "larsentoubro.com", "oil_gas", "equipment", "India"),
            ("ISGEC Heavy Engineering", "isgec.com", "oil_gas", "equipment", "India"),
            ("Anup Engineering", "anupengg.com", "oil_gas", "equipment", "India"),
            ("Praj Industries", "praj.net", "oil_gas", "equipment", "India"),
            ("Mazagon Dock Shipbuilders (Offshore)", "mazagondock.in", "oil_gas", "offshore", "India"),
            ("Multitex Filter-Mac", "multitexfilters.com", "oil_gas", "equipment", "India"),
            ("Crystal Industrial Syndicate", "crystalindustrial.in", "oil_gas", "equipment", "India"),
            ("Phils Heavy Engineering", "philshvy.com", "oil_gas", "equipment", "India"),
            ("Lloyds Engineering Works", "lloydsengg.in", "oil_gas", "equipment", "India")
        ]

    def scrape(self):
        all_companies = []
        for name, domain, sector, sub_sector, country in self.directory_targets:
            all_companies.append({
                "name": name,
                "sector": sector,
                "sub_sector": sub_sector,
                "domain": domain,
                "email_1": None,
                "email_2": None,
                "phone": None,
                "country": country,
                "city": None,
                "region": "APAC" if country in ["India", "Australia", "Japan", "South Korea"] else ("EMEA" if country in ["Germany", "Finland", "Sweden", "UK", "Italy", "Denmark", "Spain"] else "Americas"),
                "employee_count": "500+",
                "revenue_range": None,
                "source": self.name,
                "source_url": None,
                "notes": f"Scraped from Industry Directories ({sub_sector})",
                "quality_score": 0
            })
            
        deduped = {c["domain"]: c for c in all_companies}
        return list(deduped.values())
