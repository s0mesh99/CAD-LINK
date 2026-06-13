import re


class Deduplicator:
    """Deduplicate company records across multiple scrapers."""

    def __init__(self):
        self.domain_seen = set()
        self.name_country_seen = set()

    def deduplicate(self, records: list) -> list:
        """
        Deduplicate records using:
        1. Primary key: domain (website)
        2. Fallback key: normalized_name + country (for domainless records)
        Merges data — prefers records with more filled fields.
        """
        self.domain_seen.clear()
        self.name_country_seen.clear()

        domain_map = {}   # domain -> best record
        name_map = {}     # (norm_name, country) -> best record
        unique = []

        for record in records:
            domain = record.get("domain")
            name = record.get("name", "")
            country = record.get("country", "")

            if domain:
                if domain in domain_map:
                    # Merge: keep the record with more data
                    domain_map[domain] = self._merge(domain_map[domain], record)
                else:
                    domain_map[domain] = record
            else:
                # Fallback: use normalized name + country
                norm_key = (self.normalize_name(name), country.lower().strip() if country else "")
                if norm_key[0]:  # only if we have a name
                    if norm_key in name_map:
                        name_map[norm_key] = self._merge(name_map[norm_key], record)
                    else:
                        name_map[norm_key] = record

        unique.extend(domain_map.values())
        unique.extend(name_map.values())

        print(f"  [Dedup] {len(records)} records -> {len(unique)} unique ({len(records) - len(unique)} duplicates removed)")
        return unique

    def normalize_name(self, name: str) -> str:
        """Normalize company name for fuzzy matching."""
        if not name:
            return ""
        name = name.lower().strip()
        # Remove common legal suffixes
        suffixes = [
            r'\b(ltd|limited|inc|incorporated|corp|corporation|llc|plc|pvt|private|co|company)\b',
            r'\b(group|holdings|international|global|enterprises)\b',
            r'[.,\-\(\)]'
        ]
        for pattern in suffixes:
            name = re.sub(pattern, '', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    def _merge(self, existing: dict, new: dict) -> dict:
        """Merge two records — fill in blanks from the new record."""
        merged = existing.copy()
        for key, value in new.items():
            if value and not merged.get(key):
                merged[key] = value
        return merged

    def _score(self, record: dict) -> int:
        """Score a record by how many fields are filled."""
        fields = ['domain', 'email', 'phone', 'country', 'sector', 'employee_size']
        return sum(1 for f in fields if record.get(f))
