import pandas as pd
import os
from datetime import datetime
from db.client import DatabaseClient

EXPORT_PATH = f'cadlink_leads_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'

def export_to_excel():
    print(f"Connecting to Supabase...")
    db = DatabaseClient()
    
    print("Reading data from 'companies' table...")
    companies = db.get_companies()
    
    if not companies:
        print("No companies found or failed to connect.")
        return
        
    df = pd.DataFrame(companies)
    
    # Sort by quality score (highest first) or created_at
    if 'quality_score' in df.columns:
        df = df.sort_values(by=['quality_score', 'created_at'], ascending=[False, False])
        
    # Optional: Fill empty/NaN cells with empty strings for a cleaner look
    df = df.fillna('')
    
    print(f"Found {len(df)} total leads. Exporting to {EXPORT_PATH}...")
    df.to_excel(EXPORT_PATH, index=False, engine='openpyxl')
    
    print("Export complete!")

if __name__ == '__main__':
    export_to_excel()
