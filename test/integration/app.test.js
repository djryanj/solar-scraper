const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../../components/app");
const snapshotStore = require("../../components/snapshot-store");
const { withServer } = require("../helpers/http");
const { createSnapshot } = require("../fixtures/snapshot");

const originalGetSnapshotOrRefresh = snapshotStore.getSnapshotOrRefresh;

test.afterEach(() => {
  snapshotStore.getSnapshotOrRefresh = originalGetSnapshotOrRefresh;
});

test("GET /json returns the current snapshot as JSON", async () => {
  snapshotStore.getSnapshotOrRefresh = async () => createSnapshot();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/json`);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");

    const body = await response.json();
    assert.equal(body.ecuName, "Garage ECU");
    assert.equal(body.data.length, 2);
  });
});

test("GET / renders HTML using snapshot metadata", async () => {
  snapshotStore.getSnapshotOrRefresh = async () =>
    createSnapshot({
      isStale: true,
      lastError: {
        message: "timeout",
        at: "2026-03-20T10:05:00.000Z",
      },
    });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(baseUrl);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /Garage ECU at Test Site at ecu.local/);
    assert.match(body, /Release: 0.3.0/);
    assert.match(body, /Git SHA: build12/);
    assert.match(body, /Snapshot is stale/);
    assert.match(body, /Last scrape error: timeout/);
  });
});

test("GET /metrics exports Prometheus metrics for system and panels", async () => {
  snapshotStore.getSnapshotOrRefresh = async () => createSnapshot();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/metrics`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/plain/);
    assert.match(body, /solar_daily_generated 12.34/);
    assert.match(body, /solar_panel_power\{inverterId="A-1"\} 101/);
    assert.match(body, /solar_scraper_info\{version=/);
  });
});

test("missing routes return the error page with a 404 status", async () => {
  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/does-not-exist`);
    const body = await response.text();

    assert.equal(response.status, 404);
    assert.match(body, /Not Found/);
  });
});

test("route failures render the error page with a 500 status", async () => {
  snapshotStore.getSnapshotOrRefresh = async () => {
    throw new Error("boom");
  };

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/json`);
    const body = await response.text();

    assert.equal(response.status, 500);
    assert.match(body, /boom/);
  });
});