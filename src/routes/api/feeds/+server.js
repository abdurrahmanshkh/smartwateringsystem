// src/routes/api/feeds/+server.js
import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/mongodb.js';

export const GET = async ({ url }) => {
  try {
    const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get('limit') || '20')));
    const db = await getDb();

    // Read last `limit` readings (most recent first)
    const docs = await db
      .collection('readings')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Map DB docs to ThingSpeak-like feed objects (old UI expects field1..field6 + created_at)
    const feeds = docs.map(doc => {
      return {
        field1: doc.moisture !== undefined ? String(doc.moisture) : null,
        field2: doc.pumpStatus !== undefined ? String(doc.pumpStatus) : '0',
        field3: doc.systemStatus !== undefined ? String(doc.systemStatus) : '0',
        field4: doc.threshold !== undefined ? String(doc.threshold) : null,
        field5: doc.temperature !== undefined ? String(doc.temperature) : null,
        field6: doc.humidity !== undefined ? String(doc.humidity) : null,
        created_at: (doc.timestamp ? new Date(doc.timestamp) : new Date()).toISOString()
      };
    });

    // Return in the same shape your UI expects (ThingSpeak style)
    return json({ channel: { id: 'smartwateringsystem' }, feeds }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('GET /api/feeds error', err);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
