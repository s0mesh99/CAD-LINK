from scrapers.base import BaseScraper
import re

class RegionalEPCScraper(BaseScraper):
    def __init__(self):
        super().__init__("regional_epc", "manual_seed", "oil_gas")
        
        # Curated list of specific Oil & Gas EPC Design / Engineering Consultancies
        self.regional_targets = [
            # ----- UAE EPCs -----
            ("Petrofac", "petrofac.com", "Middle East"),
            ("National Petroleum Construction Company (NPCC)", "npcc.ae", "Middle East"),
            ("Dodsal Group", "dodsal.com", "Middle East"),
            ("Técnicas Reunidas UAE", "tecnicasreunidas.es", "Middle East"),
            ("Consolidated Contractors Company (CCC)", "ccc.net", "Middle East"),
            ("Al Jaber Energy Services", "aljaber.com", "Middle East"),
            ("Target Engineering Construction Company", "target.ae", "Middle East"),
            ("Galfar Engineering & Contracting Emirates", "galfaremirates.com", "Middle East"),
            ("Descon Engineering UAE", "descon.com", "Middle East"),
            ("Penspen UAE", "penspen.com", "Middle East"),
            ("Wood Group UAE", "woodplc.com", "Middle East"),
            ("Mott MacDonald UAE", "mottmac.com", "Middle East"),
            ("ILF Consulting Engineers UAE", "ilf.com", "Middle East"),
            ("Gulf Petrochemical Services & Trading", "gulfpetro.com", "Middle East"),
            ("Robt Stone ME", "robtstone.ae", "Middle East"),
            ("Ali & Sons Marine Engineering", "ali-sons.com", "Middle East"),
            ("Lamprell", "lamprell.com", "Middle East"),
            ("Eversendai Offshore", "eversendai.com", "Middle East"),
            ("Audex Fujairah", "audex.com", "Middle East"),
            ("Oceaneering UAE", "oceaneering.com", "Middle East"),
            ("Kent UAE", "kentplc.com", "Middle East"),
            ("Saipem UAE", "saipem.com", "Middle East"),
            ("McDermott UAE", "mcdermott.com", "Middle East"),
            ("KBR UAE", "kbr.com", "Middle East"),
            ("Archirodon Group", "archirodon.net", "Middle East"),
            ("Valentine Maritime", "vmgulf.com", "Middle East"),
            ("Altrad Middle East", "altrad.com", "Middle East"),
            ("Bilfinger Middle East", "middleeast.bilfinger.com", "Middle East"),
            ("SNC-Lavalin UAE", "snclavalin.com", "Middle East"),
            ("Sepam UAE", "sepam.com", "Middle East"),
            
            # ----- India EPCs -----
            ("L&T Hydrocarbon Engineering", "lnthydrocarbon.com", "India"),
            ("Engineers India Limited (EIL)", "engineersindia.com", "India"),
            ("Tata Projects", "tataprojects.com", "India"),
            ("Afcons Infrastructure", "afcons.com", "India"),
            ("ISGEC Heavy Engineering", "isgec.com", "India"),
            ("Punj Lloyd", "punjlloyd.com", "India"),
            ("Toyo Engineering India", "toyo-eng.com", "India"),
            ("Megha Engineering & Infrastructures (MEIL)", "meil.in", "India"),
            ("Kalpataru Projects International", "kalpataruprojects.com", "India"),
            ("KEC International", "kecrpg.com", "India"),
            ("Nuberg EPC", "nubergepc.com", "India"),
            ("Technip Energies India", "technipenergies.com", "India"),
            ("Aker Solutions India", "akersolutions.com", "India"),
            ("Worley India", "worley.com", "India"),
            ("Fluor Daniel India", "fluor.com", "India"),
            ("Bechtel India", "bechtel.com", "India"),
            ("Simon India", "simonindia.com", "India"),
            ("Thermax Global", "thermaxglobal.com", "India"),
            ("Praj Industries", "praj.net", "India"),
            ("Triune Energy Services", "triune.co.in", "India"),
            ("Valdel Engineers & Constructors", "valdel.com", "India"),
            ("Larsen & Toubro Chiyoda", "ltchiyoda.com", "India"),
            ("TATA Consulting Engineers (TCE)", "tce.co.in", "India"),
            ("Nauvata Engineering", "nauvata.com", "India"),
            ("Neilsoft", "neilsoft.com", "India"),
            ("L&T Sargent & Lundy", "ltsl.com", "India"),
            ("Mott MacDonald India", "mottmac.com", "India"),
            ("Kavin Engineering", "kavineng.com", "India"),
            ("Dastur Energy", "dastur.com", "India"),
            ("Quest Global O&G", "quest-global.com", "India"),
            ("Saipem India", "saipem.com", "India"),
            ("KBR India", "kbr.com", "India"),
            ("McDermott India", "mcdermott.com", "India"),
            ("Wood India", "woodplc.com", "India"),
            
            # ----- Saudi Arabia EPCs -----
            ("Saudi Aramco Base Oil Co (Luberef)", "luberef.com", "Middle East"),
            ("Aramco Overseas Company", "aramco.com", "Middle East"),
            ("SABIC Engineering", "sabic.com", "Middle East"),
            ("Nesma & Partners", "nesmapartners.com", "Middle East"),
            ("Al-Rashid Trading & Contracting", "rtcc.com.sa", "Middle East"),
            ("Almabani General Contractors", "almabani.co", "Middle East"),
            ("J&P (Joannou & Paraskevaides)", "jandp-group.com", "Middle East"),
            ("Dayim Punj Lloyd", "punjlloyd.com", "Middle East"),
            ("Sendan International", "sendan.com.sa", "Middle East"),
            ("Azmeel Contracting", "azmeel.com", "Middle East"),
            ("SRACO Company", "sraco.com.sa", "Middle East"),
            ("Al-Osais Contracting", "alosais.com", "Middle East"),
            ("Faisal J. Al-Hajri", "alhajri.com", "Middle East"),
            ("Al-Hammad Engineering", "alhammad.com", "Middle East"),
            ("Al-Khorayef Group", "alkhorayef.com", "Middle East"),
            ("Ali Reza Group", "alireza.com", "Middle East"),
            ("Saudi Archirodon", "archirodon.net", "Middle East"),
            ("A. Al-Saihati", "saihati.com", "Middle East"),
            ("Kent Saudi Arabia", "kentplc.com", "Middle East"),
            
            # ----- Qatar EPCs -----
            ("QatarEnergy", "qatarenergy.qa", "Middle East"),
            ("Qatargas EPC", "qatargas.com", "Middle East"),
            ("Midmac Contracting", "midmac.net", "Middle East"),
            ("Galfar Al Misnad", "galfarqatar.com.qa", "Middle East"),
            ("UCC Holding", "uccholding.com", "Middle East"),
            ("HBK Contracting", "hbkcontracting.com", "Middle East"),
            ("Al Jaber Engineering (JEC)", "jec.qa", "Middle East"),
            ("Boom Construction", "boomconstruction.net", "Middle East"),
            ("CDC Qatar", "cdcqatar.com", "Middle East"),
            ("Redco Construction (Al Mana)", "redcoalmana.com", "Middle East"),
            ("Qatar Building Company", "qatarbuildingcompany.com", "Middle East"),
            ("Medgulf Construction", "medgulfconstruction.com", "Middle East"),
            ("Qcon", "qcon.com.qa", "Middle East"),
            ("Black Cat Engineering", "blackcat.qa", "Middle East")
        ]

    def scrape(self):
        all_companies = []
        for name, domain, region in self.regional_targets:
            # Simple heuristic for country based on domain/name if region is Middle East
            country = "India" if region == "India" else ("Saudi Arabia" if ".sa" in domain or "Saudi" in name else ("Qatar" if ".qa" in domain or "Qatar" in name else "United Arab Emirates"))
            notes = f"High-priority {region} O&G EPC Consultancy"
            all_companies.append({
                "name": name,
                "sector": self.sector,
                "sub_sector": "engineering_consultancy",
                "domain": domain,
                "email_1": None,
                "email_2": None,
                "phone": None,
                "country": country,
                "city": None,
                "region": region,
                "employee_count": "500+",
                "revenue_range": None,
                "source": self.name,
                "source_url": None,
                "notes": notes,
                "quality_score": 0
            })
            
        deduped = {c["domain"]: c for c in all_companies}
        return list(deduped.values())
