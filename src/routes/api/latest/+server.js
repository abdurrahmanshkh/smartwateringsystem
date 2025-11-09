// ==================================================
// File: src/routes/api/latest/+server.js
// Purpose: GET endpoint to return latest telemetry
// URL: GET /api/latest
// ==================================================

import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/mongodb.js';

export const GET = async () => {
  try {
    const db = await getDb();

    const latest = await db
      .collection('readings')
      .find()
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    return json(latest[0] || null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('GET /api/latest error', err);
    return json({ ok: false, error: String(err) }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};
