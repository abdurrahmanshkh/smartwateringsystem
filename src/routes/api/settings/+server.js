// ==================================================
// File: src/routes/api/settings/+server.js
// Purpose: GET to fetch current settings (threshold, systemStatus).
//          POST to update settings manually (from web UI).
// URL: GET /api/settings
//      POST /api/settings
// ==================================================

import { json } from '@sveltejs/kit';
import clientPromise from '$lib/server/mongodb.js';

const DEFAULT_SETTINGS = { threshold: 250, systemStatus: 0 };

export const GET = async () => {
  try {
    const client = await clientPromise;
    const db = client.db();

    const settings = await db.collection('settings').findOne({ _id: 'singleton' });
    const merged = Object.assign({}, DEFAULT_SETTINGS, settings);

    return json(merged, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('GET /api/settings error', err);
    return json({ ok: false, error: String(err) }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();

    await db.collection('settings').updateOne(
      { _id: 'singleton' },
      { $set: body },
      { upsert: true }
    );

    return json({ ok: true }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('POST /api/settings error', err);
    return json({ ok: false, error: String(err) }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};
