import sqlite3
import pandas as pd
import os
from datetime import datetime

DB_PATH = 'cadlink.db'
EXPORT_PATH = f'cadlink_leads_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'

def export_to_excel():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    
    print("Reading data from 'companies' table...")
    # Read all columns from the companies table
    df = pd.read_sql_query("SELECT * FROM companies", conn)
    
    # Sort by quality score (highest first) or created_at
    if 'quality_score' in df.columns:
        df = df.sort_values(by=['quality_score', 'created_at'], ascending=[False, False])
        
    # Optional: Fill empty/NaN cells with empty strings for a cleaner look
    df = df.fillna('')
    
    print(f"Found {len(df)} total leads. Exporting to {EXPORT_PATH}...")
    df.to_excel(EXPORT_PATH, index=False, engine='openpyxl')
    
    print("Export complete!")
    conn.close()

if __name__ == '__main__':
    export_to_excel()
