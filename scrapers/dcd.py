from scrapers.base import BaseScraper
import time

class DCDScraper(BaseScraper):
    def __init__(self):
        super().__init__("dcd", "https://www.datacenterdynamics.com", "data_center")
        self.known_companies = [
            ("Equinix", "equinix.com", "colocation", "Americas"),
            ("Digital Realty", "digitalrealty.com", "colocation", "Americas"),
            ("NTT Global Data Centers", "hello.global.ntt", "colocation", "APAC"),
            ("Iron Mountain Data Centers", "ironmountain.com", "colocation", "Americas"),
            ("CyrusOne", "cyrusone.com", "colocation", "Americas"),
            ("Turner Construction", "turnerconstruction.com", "design_build", "Americas"),
            ("DPR Construction", "dpr.com", "design_build", "Americas"),
            ("AECOM", "aecom.com", "design_build", "Americas"),
            ("Jacobs Engineering", "jacobs.com", "design_build", "Americas"),
            ("Compass Data Centers", "compassdatacenters.com", "hyperscale", "Americas"),
            ("Vantage Data Centers", "vantage-dc.com", "hyperscale", "Americas"),
            ("Vertiv", "vertiv.com", "design_build", "Americas"),
            ("Schneider Electric", "se.com", "design_build", "EMEA"),
            ("Arup Group", "arup.com", "design_build", "EMEA"),
            ("Mott MacDonald", "mottmac.com", "design_build", "EMEA"),
            ("STT GDC", "sttelemedia.com", "colocation", "APAC"),
            ("AIMS Data Centre", "aims.com.my", "colocation", "APAC"),
            ("Holder Construction", "holderconstruction.com", "design_build", "Americas"),
            ("QTS Realty Trust", "qtsdatacenters.com", "colocation", "Americas"),
            ("Cyxtera Technologies", "cyxtera.com", "colocation", "Americas"),
            ("CoreSite", "coresite.com", "colocation", "Americas"),
            ("Switch", "switch.com", "colocation", "Americas"),
            ("DataBank", "databank.com", "colocation", "Americas"),
            ("Flexential", "flexential.com", "colocation", "Americas"),
            ("TierPoint", "tierpoint.com", "colocation", "Americas"),
            ("EdgeConneX", "edgeconnex.com", "colocation", "Americas"),
            ("Evoque Data Center Solutions", "evoquedcs.com", "colocation", "Americas"),
            ("Cologix", "cologix.com", "colocation", "Americas"),
            ("Sabey Data Centers", "sabeydatacenters.com", "colocation", "Americas"),
            ("Aligned Data Centers", "aligneddc.com", "colocation", "Americas"),
            ("Stack Infrastructure", "stackinfra.com", "colocation", "Americas"),
            ("Yondr Group", "yondrgroup.com", "hyperscale", "EMEA"),
            ("Kao Data", "kaodata.com", "colocation", "EMEA"),
            ("Colt Data Centre Services", "coltdatacentres.net", "colocation", "EMEA"),
            ("Global Switch", "globalswitch.com", "colocation", "EMEA"),
            ("Interxion", "interxion.com", "colocation", "EMEA"),
            ("Maincubes", "maincubes.com", "colocation", "EMEA"),
            ("NorthC Datacenters", "northcdatacenters.com", "colocation", "EMEA"),
            ("Odata", "odata.com.br", "colocation", "Americas"),
            ("Ascenty", "ascenty.com", "colocation", "Americas"),
            ("Scala Data Centers", "scaladatacenters.com", "colocation", "Americas"),
            ("PDG (Princeton Digital Group)", "princetondg.com", "colocation", "APAC"),
            ("AirTrunk", "airtrunk.com", "hyperscale", "APAC"),
            ("NextDC", "nextdc.com", "colocation", "APAC"),
            ("Macquarie Data Centres", "macquariedatacentres.com", "colocation", "APAC"),
            ("Keppel Data Centres", "keppeldatacentres.com", "colocation", "APAC"),
            ("Chindata Group", "chindatagroup.com", "hyperscale", "APAC"),
            ("GDS Holdings", "gds-services.com", "colocation", "APAC"),
            ("VNET", "vnet.com", "colocation", "APAC"),
            ("L&T Construction", "lntecc.com", "design_build", "APAC"),
            ("Sterling and Wilson", "sterlingandwilson.com", "design_build", "APAC")
        ]

    def scrape(self):
        all_companies = []
        for name, domain, sub_sector, region in self.known_companies:
            all_companies.append({
                "name": name,
                "sector": self.sector,
                "sub_sector": sub_sector,
                "domain": domain,
                "email_1": None,
                "email_2": None,
                "phone": None,
                "country": None,
                "city": None,
                "region": region,
                "employee_count": "500+",
                "revenue_range": None,
                "source": self.name,
                "source_url": None,
                "notes": "Seeded Major Data Center Company",
                "quality_score": 0
            })
            
        deduped = {c["domain"] if c.get("domain") else c["name"]: c for c in all_companies}
        return list(deduped.values())
        
    def resolve_domain(self, name):
        clean = ''.join(e for e in name if e.isalnum()).lower()
        return f"{clean}.com" if clean else None
