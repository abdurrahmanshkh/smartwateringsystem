// ==================================================
// File: src/lib/server/mongodb.js
// Purpose: shared MongoDB client promise for SvelteKit server endpoints
// ==================================================

import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

const uri = env.MONGODB_URI;
if (!uri) {
	throw new Error('❌ Missing MONGODB_URI environment variable');
}

// Global cache to reuse the same client across invocations
let cachedClient = globalThis._mongoClient;

if (!cachedClient) {
	const client = new MongoClient(uri);
	cachedClient = client.connect();
	globalThis._mongoClient = cachedClient;
}

export async function getDb() {
	const client = await cachedClient;
	return client.db('smart_watering_system'); // your DB name
}
