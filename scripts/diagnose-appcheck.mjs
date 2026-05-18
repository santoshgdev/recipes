#!/usr/bin/env node
// Diagnoses Firebase App Check configuration
//   node scripts/diagnose-appcheck.mjs

import { initializeApp, applicationDefault } from "firebase-admin/app";

const PROJECT_ID = "recipes-496701";
const APP_ID = "1:151018575958:web:5b1c87caa5b1dacdf383f7";
const SITE_KEY = "6Ldzru8sAAAAAIeY_EjkmK1DS8K15OxwfPAMrMRp";

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const tokenResult = await app.options.credential.getAccessToken();
const token = tokenResult.access_token;

console.log("✓ Got ADC access token\n");

async function call(label, url, opts = {}) {
  console.log(`── ${label} ──`);
  const res = await fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts.headers },
  });
  const body = await res.text();
  console.log(`   Status: ${res.status}`);
  try {
    console.log(`   Body: ${JSON.stringify(JSON.parse(body), null, 2).slice(0, 600)}`);
  } catch {
    console.log(`   Body: ${body.slice(0, 200)}`);
  }
  console.log();
  return { status: res.status, body };
}

// 1. Check reCAPTCHA v3 config stored in App Check
await call(
  "1. reCAPTCHA v3 config in App Check",
  `https://firebaseappcheck.googleapis.com/v1beta/projects/${PROJECT_ID}/apps/${APP_ID}/recaptchaV3Config`,
);

// 2. Check enforcement state for Firestore
await call(
  "2. Firestore enforcement state",
  `https://firebaseappcheck.googleapis.com/v1beta/projects/${PROJECT_ID}/services/firestore.googleapis.com`,
);

// 3. List all registered apps
await call(
  "3. All App Check apps",
  `https://firebaseappcheck.googleapis.com/v1beta/projects/${PROJECT_ID}/apps`,
);

console.log(`Expected site key in code: ${SITE_KEY}`);
