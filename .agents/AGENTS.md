# Deployment Protocol

- **NEVER deploy changes to production (e.g. Firebase) without explicit user confirmation.**
- After making UI or functionality changes, ALWAYS start the local development server (e.g., `npm run dev`) and ask the user to preview and confirm the changes locally.
- Only run deployment scripts (like `firebase deploy` or git push) AFTER the user has verified the local preview and explicitly stated it is ready for production.
