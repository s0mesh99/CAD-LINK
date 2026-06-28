import os
import time
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from dotenv import load_dotenv

class GeminiRotator:
    def __init__(self):
        load_dotenv()
        keys_str = os.environ.get("GEMINI_API_KEYS", "")
        if keys_str:
            self.keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        else:
            single = os.environ.get("GEMINI_API_KEY")
            self.keys = [single] if single else []
            
        if not self.keys:
            raise ValueError("No GEMINI_API_KEYS found in .env")
            
        self.current_idx = 0
        self._configure_current_key()
        
    def _configure_current_key(self):
        key = self.keys[self.current_idx]
        genai.configure(api_key=key)
        
    def switch_key(self):
        self.current_idx = (self.current_idx + 1) % len(self.keys)
        self._configure_current_key()
        
    def generate_content(self, prompt, model_name='gemini-flash-latest', generation_config=None, max_retries=None):
        if max_retries is None:
            max_retries = len(self.keys) * 2 # try each key twice
            
        for attempt in range(max_retries):
            try:
                model = genai.GenerativeModel(model_name, generation_config=generation_config)
                return model.generate_content(prompt)
            except ResourceExhausted as e:
                print(f"[Rotator] Rate limit hit on key {self.current_idx + 1}. Switching keys...", flush=True)
                self.switch_key()
                time.sleep(1)
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower() or "exhausted" in str(e).lower():
                    print(f"[Rotator] Rate limit hit on key {self.current_idx + 1}. Switching keys...", flush=True)
                    self.switch_key()
                    time.sleep(1)
                else:
                    # Reraise if it's a different error (e.g., bad prompt)
                    raise e
                    
        raise Exception("All API keys exhausted or max retries reached.")

# Singleton instance
rotator = GeminiRotator()

def generate_content_with_rotation(prompt, model_name='gemini-flash-latest', generation_config=None):
    return rotator.generate_content(prompt, model_name, generation_config)
