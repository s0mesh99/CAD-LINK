import os, requests
from dotenv import load_dotenv
load_dotenv('DASHBOARD/.env')
token = os.getenv('VITE_GITHUB_TOKEN')
url = 'https://api.github.com/repos/s0mesh99/CAD-LINK/actions/runs?per_page=5'
headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github.v3+json'}
response = requests.get(url, headers=headers)
if response.status_code == 200:
    runs = response.json().get('workflow_runs', [])
    if not runs:
        print("No workflow runs found.")
    for run in runs:
        print(f"Workflow: {run['name']} | Status: {run['status']} | Conclusion: {run['conclusion']} | Started: {run['created_at']}")
else:
    print('Failed:', response.status_code, response.text)
