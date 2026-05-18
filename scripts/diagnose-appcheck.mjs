#!/usr/bin/env node
import { initializeApp, applicationDefault } from "firebase-admin/app";

const PROJECT_ID = "recipes-496701";
const PROJECT_NUMBER = "151018575958";
const APP_ID = "1:151018575958:web:5b1c87caa5b1dacdf383f7";
const SITE_KEY = "6Ldzru8sAAAAAIeY_EjkmK1DS8K15OxwfPAMrMRp";

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const tokenResult = await app.options.credential.getAccessToken();
const token = tokenResult.access_token;

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "x-goog-user-project": PROJECT_ID,
};

async function call(label, url) {
  console.log(`── ${label} ──`);
  const res = await fetch(url, { headers });
  const body = await res.text();
  console.log(`   Status: ${res.status}`);
  try { console.log(JSON.stringify(JSON.parse(body), null, 2).slice(0, 800)); }
  catch { console.log(body.slice(0, 300)); }
  console.log();
}

// Check if API is enabled
console.log("── 0. API enabled check ──");
const apiRes = await fetch(
  `https://serviceusage.googleapis.com/v1/projects/${PROJECT_NUMBER}/services/firebaseappcheck.googleapis.com`,
  { headers }
);
const apiBody = await apiRes.json();
console.log(`   Status: ${apiRes.status}, state: ${apiBody?.state ?? apiBody?.error?.message}`);
console.log();

await call("1. reCAPTCHA v3 config", `https://firebaseappcheck.googleapis.com/v1/projects/${PROJECT_ID}/apps/${APP_ID}/recaptchaV3Config`);
await call("2. Firestore enforcement", `https://firebaseappcheck.googleapis.com/v1/projects/${PROJECT_ID}/services/firestore.googleapis.com`);

console.log(`Site key in code: ${SITE_KEY}`);
