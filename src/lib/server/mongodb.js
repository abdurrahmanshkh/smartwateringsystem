// ==================================================
// File: src/lib/server/mongodb.js
// Purpose: shared MongoDB client promise for SvelteKit server endpoints
// ==================================================

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable not set');
}

// Reuse the client across lambda invocations
if (!globalThis.__mongoClientPromise) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  globalThis.__mongoClientPromise = client.connect();
}

export default globalThis.__mongoClientPromise;
