#!/usr/bin/env node

const base = process.env.BASE_URL || "http://127.0.0.1:3015";

let passed = 0;
let total = 0;

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, text, json };
}

function assert(condition, name, details = "") {
  total += 1;
  if (condition) {
    passed += 1;
    process.stdout.write(`PASS: ${name}\n`);
    return;
  }

  process.stdout.write(`FAIL: ${name}${details ? ` -> ${details}` : ""}\n`);
}

async function main() {
  const alias = `smoke-${Date.now().toString(36)}`;

  const create = await request("/api/public/url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: "https://example.com/smoke",
      customAlias: alias,
      expiresAt: null,
    }),
  });

  assert(
    create.response.status === 201 && create.json?.success === true,
    "Create public URL",
    `status=${create.response.status} body=${create.text}`
  );

  const createdId = create.json?.data?.id;

  const redirect = await fetch(`${base}/${alias}`, { redirect: "manual" });
  assert(
    redirect.status === 302 &&
      (redirect.headers.get("location") || "").includes("https://example.com/smoke"),
    "Public redirect returns 302",
    `status=${redirect.status} location=${redirect.headers.get("location")}`
  );

  const invalidUrl = await request("/api/public/url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "ftp://example.com" }),
  });

  assert(
    invalidUrl.response.status === 400,
    "Reject non-http(s) URL",
    `status=${invalidUrl.response.status} body=${invalidUrl.text}`
  );

  const invalidExpiry = await request("/api/public/url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://example.com", expiresAt: "not-a-date" }),
  });

  assert(
    invalidExpiry.response.status === 400,
    "Reject invalid expiresAt",
    `status=${invalidExpiry.response.status} body=${invalidExpiry.text}`
  );

  const manageNoAuth = await request(
    `/api/url/manage/${createdId || "507f1f77bcf86cd799439011"}`
  );

  assert(
    manageNoAuth.response.status === 401,
    "URL manage requires auth",
    `status=${manageNoAuth.response.status} body=${manageNoAuth.text}`
  );

  const campaignNoAuth = await request("/api/campaign");
  assert(
    campaignNoAuth.response.status === 401,
    "Campaign list requires auth",
    `status=${campaignNoAuth.response.status} body=${campaignNoAuth.text}`
  );

  const analyticsOverviewNoAuth = await request("/api/analytics/overview");
  assert(
    analyticsOverviewNoAuth.response.status === 401,
    "Analytics overview requires auth",
    `status=${analyticsOverviewNoAuth.response.status} body=${analyticsOverviewNoAuth.text}`
  );

  const adminStatsNoAuth = await request("/api/admin/stats");
  assert(
    adminStatsNoAuth.response.status === 401,
    "Admin stats requires auth",
    `status=${adminStatsNoAuth.response.status} body=${adminStatsNoAuth.text}`
  );

  const qr = await request("/api/qr", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "https://example.com" }),
  });

  assert(
    qr.response.status === 200 && qr.json?.success === true,
    "QR endpoint works",
    `status=${qr.response.status} body=${qr.text}`
  );

  process.stdout.write(`SMOKE_RESULT ${passed}/${total}\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
