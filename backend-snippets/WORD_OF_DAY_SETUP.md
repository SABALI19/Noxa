Add these routes to the real backend if you want the dashboard word-of-the-day to be community-driven.

Routes:
- `GET /api/v1/community/words`
- `GET /api/v1/community/words/featured`
- `POST /api/v1/community/words`

Expected payload for a community submission:

```json
{
  "word": "Momentum",
  "meaning": "The energy that builds when you keep moving toward a goal.",
  "example": "Protect your momentum by finishing one meaningful task before noon."
}
```

Notes:
- The frontend already reads from the featured community route.
- The frontend already has a submission path for new entries.
- Until the real backend is added, the dashboard falls back to cached local storage data and picks a deterministic daily entry from the local community pool.
