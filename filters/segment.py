class CompanyFilter:
    """Score, filter, and segment company records for targeted outreach."""

    SCORE_FIELDS = ['domain', 'email', 'phone', 'country', 'sector', 'employee_size']

    def score_company(self, record: dict) -> int:
        """
        Score a company 0-6 based on data completeness:
        +1 for each filled field: domain, email, phone, country, sector, employee_size
        """
        return sum(1 for f in self.SCORE_FIELDS if record.get(f))

    def apply_filters(self, records: list, min_quality: int = 0) -> list:
        """Filter records by minimum quality score (0-6)."""
        if min_quality <= 0:
            return records
        filtered = [r for r in records if self.score_company(r) >= min_quality]
        print(f"  [Filter] {len(records)} records -> {len(filtered)} passed (min_quality={min_quality})")
        return filtered

    def segment(self, records: list) -> dict:
        """Group records into {sector}_{region} buckets for segmented export."""
        segments = {}
        for r in records:
            sector = r.get("sector", "unknown")
            region = r.get("region", "global")
            key = f"{sector}_{region}"
            if key not in segments:
                segments[key] = []
            segments[key].append(r)

        print(f"  [Segment] Created {len(segments)} segments:")
        for key, recs in sorted(segments.items()):
            print(f"    {key}: {len(recs)} companies")
        return segments
