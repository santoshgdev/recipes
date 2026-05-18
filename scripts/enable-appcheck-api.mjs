#!/usr/bin/env node
// Enables the firebaseappcheck.googleapis.com API on the project
//   node scripts/enable-appcheck-api.mjs

import { initializeApp, applicationDefault } from "firebase-admin/app";

const PROJECT_ID = "recipes-496701";
const PROJECT_NUMBER = "151018575958";

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const tokenResult = await app.options.credential.getAccessToken();
const token = tokenResult.access_token;

console.log("Enabling firebaseappcheck.googleapis.com...");

const res = await fetch(
  `https://serviceusage.googleapis.com/v1/projects/${PROJECT_NUMBER}/services/firebaseappcheck.googleapis.com:enable`,
  { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" }
);

const body = await res.json();
console.log(`Status: ${res.status}`);
console.log(JSON.stringify(body, null, 2));

if (res.status === 200) {
  console.log("\n✓ API enabled. Wait ~30 seconds then retry the site.");
} else {
  console.log("\n✗ Failed — check error above.");
}
