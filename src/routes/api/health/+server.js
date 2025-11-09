// ==================================================
// File: src/routes/api/health/+server.js
// Purpose: Simple health check used by dashboard or ESP to verify API alive
// URL: GET /api/health
// ==================================================

import { json } from '@sveltejs/kit';

export const GET = async () => {
  return json({ ok: true, time: new Date().toISOString() }, { headers: { 'Access-Control-Allow-Origin': '*' } });
};
