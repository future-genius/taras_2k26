/**
 * TARAS 2K26 — Real Load Test Script (k6)
 *
 * Purpose: Measure real Firebase/Firestore performance under concurrent load.
 *
 * ─── PREREQUISITES ────────────────────────────────────────────────────────────
 * 1. Install k6: https://k6.io/docs/getting-started/installation/
 *    - Windows (Chocolatey): choco install k6
 *    - Windows (winget):     winget install k6
 *
 * 2. Set environment variables before running:
 *    $env:FIREBASE_PROJECT_ID = "taras-2k26"          # or staging project
 *    $env:FIREBASE_API_KEY    = "your-api-key"
 *
 * 3. Run a specific scenario:
 *    k6 run --env SCENARIO=100  load-test.k6.js
 *    k6 run --env SCENARIO=500  load-test.k6.js
 *    k6 run --env SCENARIO=1000 load-test.k6.js
 *    k6 run --env SCENARIO=1500 load-test.k6.js
 *    k6 run --env SCENARIO=2000 load-test.k6.js
 *
 * ─── SAFETY NOTE ──────────────────────────────────────────────────────────────
 * NEVER run destructive write tests against the LIVE production database.
 * Use a dedicated Firebase staging project for write/transaction tests.
 * Read-only GET requests are safe to run against production.
 *
 * ─── OUTPUT ──────────────────────────────────────────────────────────────────
 * k6 reports: requests, failure rate, p50/p95/p99 latency, RPS.
 * Each scenario reports PASS or FAIL based on thresholds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────────────────────────
const firestoreReads     = new Counter('firestore_reads');
const firestoreFailures  = new Rate('firestore_failure_rate');
const firestoreLatency   = new Trend('firestore_latency_ms', true);
const registrationLatency = new Trend('registration_latency_ms', true);

// ─── Scenario Configuration ───────────────────────────────────────────────────
const SCENARIO_MAP = {
  '100':  { vus: 100,  duration: '30s' },
  '500':  { vus: 500,  duration: '60s' },
  '1000': { vus: 1000, duration: '90s' },
  '1500': { vus: 1500, duration: '120s' },
  '2000': { vus: 2000, duration: '120s' },
};

const scenarioKey = __ENV.SCENARIO || '100';
const scenario = SCENARIO_MAP[scenarioKey] || SCENARIO_MAP['100'];

const PROJECT_ID = __ENV.FIREBASE_PROJECT_ID || 'taras-2k26';
const API_KEY    = __ENV.FIREBASE_API_KEY    || '';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export const options = {
  vus:      scenario.vus,
  duration: scenario.duration,
  thresholds: {
    // All Firestore requests must succeed at ≥95%
    firestore_failure_rate: [{ threshold: 'rate<0.05', abortOnFail: false }],
    // Median latency must be < 800ms
    firestore_latency_ms:   [{ threshold: 'p(50)<800', abortOnFail: false }],
    // p95 latency must be < 3000ms (3s)
    'firestore_latency_ms{type:p95}': [{ threshold: 'p(95)<3000', abortOnFail: false }],
    // HTTP error rate < 5%
    http_req_failed:        [{ threshold: 'rate<0.05', abortOnFail: false }],
  },
};

const headers = {
  'Content-Type': 'application/json',
  // In a real secured test, pass an ID token here:
  // 'Authorization': `Bearer ${__ENV.FIREBASE_ID_TOKEN}`,
};

// ─── Test Scenarios ───────────────────────────────────────────────────────────

/**
 * Scenario 1: Public events list read (Firestore REST API)
 * READ-ONLY — safe to run against production.
 */
function scenarioEventsRead() {
  const url = `${FIRESTORE_BASE}/events?pageSize=20&key=${API_KEY}`;
  const start = Date.now();
  const res = http.get(url, { headers, tags: { name: 'events_read' } });
  const elapsed = Date.now() - start;

  firestoreLatency.add(elapsed);
  firestoreReads.add(1);

  const ok = check(res, {
    'events_read: status 200': (r) => r.status === 200,
    'events_read: has documents': (r) => r.body && r.body.includes('documents'),
  });
  if (!ok) firestoreFailures.add(1);
}

/**
 * Scenario 2: Certificate verification lookup (READ-ONLY)
 * Tests public certificate ID lookup — safe against production.
 */
function scenarioCertVerify() {
  const testCertId = 'TARAS26-CERT-TEST01';
  const url = `${FIRESTORE_BASE}/certificate_records/${testCertId}?key=${API_KEY}`;
  const start = Date.now();
  const res = http.get(url, { headers, tags: { name: 'cert_verify' } });
  const elapsed = Date.now() - start;

  firestoreLatency.add(elapsed);
  firestoreReads.add(1);

  // 200 (found) or 404 (not found) are both valid responses for a lookup
  const ok = check(res, {
    'cert_verify: responded': (r) => r.status === 200 || r.status === 404,
  });
  if (!ok) firestoreFailures.add(1);
}

/**
 * Scenario 3: Participant count aggregation query
 * Uses Firestore runAggregationQuery REST endpoint.
 * READ-ONLY — safe against production.
 */
function scenarioAggregationCount() {
  const url = `${FIRESTORE_BASE}:runAggregationQuery?key=${API_KEY}`;
  const body = JSON.stringify({
    structuredAggregationQuery: {
      aggregations: [{ alias: 'count', count: {} }],
      structuredQuery: {
        from: [{ collectionId: 'participants' }],
      },
    },
  });

  const start = Date.now();
  const res = http.post(url, body, { headers, tags: { name: 'count_aggregation' } });
  const elapsed = Date.now() - start;

  registrationLatency.add(elapsed);
  firestoreReads.add(1);

  const ok = check(res, {
    'count_agg: status 200': (r) => r.status === 200,
  });
  if (!ok) firestoreFailures.add(1);
}

// ─── Virtual User Entrypoint ──────────────────────────────────────────────────
export default function () {
  scenarioEventsRead();
  sleep(0.2);

  scenarioCertVerify();
  sleep(0.2);

  scenarioAggregationCount();
  sleep(Math.random() * 0.5 + 0.1);
}

// ─── Summary Output ───────────────────────────────────────────────────────────
export function handleSummary(data) {
  const failureRate = data.metrics.firestore_failure_rate?.values?.rate ?? 0;
  const p50 = data.metrics.firestore_latency_ms?.values?.['p(50)'] ?? 0;
  const p95 = data.metrics.firestore_latency_ms?.values?.['p(95)'] ?? 0;
  const p99 = data.metrics.firestore_latency_ms?.values?.['p(99)'] ?? 0;
  const reqs = data.metrics.http_reqs?.values?.count ?? 0;
  const rps  = data.metrics.http_reqs?.values?.rate  ?? 0;

  const pass =
    failureRate < 0.05 &&
    p50 < 800 &&
    p95 < 3000;

  const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TARAS 2K26 — Load Test Results: ${scenarioKey} Users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Scenario    : ${scenarioKey} concurrent virtual users
  Duration    : ${scenario.duration}
  Total Reqs  : ${reqs}
  RPS         : ${rps.toFixed(2)} req/s

  Latency
    p50  : ${p50.toFixed(0)} ms
    p95  : ${p95.toFixed(0)} ms
    p99  : ${p99.toFixed(0)} ms

  Error Rate  : ${(failureRate * 100).toFixed(2)}%

  VERDICT     : ${pass ? '✅ PASS' : '❌ FAIL'}

  Thresholds
    p50 < 800ms  : ${p50 < 800 ? 'PASS' : 'FAIL'}
    p95 < 3000ms : ${p95 < 3000 ? 'PASS' : 'FAIL'}
    errors < 5%  : ${failureRate < 0.05 ? 'PASS' : 'FAIL'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  console.log(summary);

  return {
    'load-test-summary.txt': summary,
    stdout: summary,
  };
}
