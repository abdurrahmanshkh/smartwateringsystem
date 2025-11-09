// ==================================================
// File: src/routes/api/update/+server.js
// Purpose: POST endpoint where the ESP8266 will send telemetry
// URL: POST /api/update
// ==================================================

import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/mongodb.js';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();

    const db = await getDb();

    // Insert telemetry into 'readings' collection
    const readingsColl = db.collection('readings');
    const readingDoc = Object.assign({}, body, { timestamp: new Date() });
    await readingsColl.insertOne(readingDoc);

    // Optionally update the singleton settings doc if threshold/systemStatus are provided
    const settingsUpdates = {};
    if (body.threshold !== undefined) settingsUpdates.threshold = body.threshold;
    if (body.systemStatus !== undefined) settingsUpdates.systemStatus = body.systemStatus;

    if (Object.keys(settingsUpdates).length > 0) {
      const settingsColl = db.collection('settings');
      await settingsColl.updateOne({ _id: 'singleton' }, { $set: settingsUpdates }, { upsert: true });
    }

    return json({ ok: true, message: 'saved' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('POST /api/update error', err);
    return json({ ok: false, error: String(err) }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};
