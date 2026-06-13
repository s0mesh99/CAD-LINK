import time, random, logging

class RateLimiter:
    """
    Shared rate limiter used by ALL scrapers.
    Prevents bans by mimicking human browsing patterns.
    """
    def __init__(self, min_delay=2.0, max_delay=6.0,
                 burst_after=15, burst_sleep_min=45, burst_sleep_max=120):
        self.min_delay       = min_delay
        self.max_delay       = max_delay
        self.burst_after     = burst_after
        self.burst_sleep_min = burst_sleep_min
        self.burst_sleep_max = burst_sleep_max
        self.request_count   = 0

    def wait(self, context: str = ''):
        delay = random.uniform(self.min_delay, self.max_delay)
        logging.debug(f"[RateLimiter] {context} — sleeping {delay:.1f}s")
        time.sleep(delay)
        self.request_count += 1
        if self.request_count % self.burst_after == 0:
            burst = random.uniform(self.burst_sleep_min, self.burst_sleep_max)
            logging.info(f"[RateLimiter] Burst pause: {burst:.0f}s")
            time.sleep(burst)

    def reset(self):
        self.request_count = 0
