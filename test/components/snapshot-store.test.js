const test = require("node:test");
const assert = require("node:assert/strict");

const { SnapshotStore } = require("../../components/snapshot-store");

function createClock(startIso) {
  let current = new Date(startIso);

  return {
    now() {
      return new Date(current);
    },
    advanceMs(value) {
      current = new Date(current.getTime() + value);
    },
  };
}

function createVars() {
  return {
    vers: "0.3.0-test-build1234",
    releaseVersion: "0.3.0",
    gitSha: "build12",
    hostname: "test-host",
    ecuHost: "ecu.local",
    scrapeIntervalMs: 5000,
  };
}

function createResult() {
  return {
    totalGen: 10,
    dailyGen: 2,
    currentSystemPower: 300,
    siteName: "Roof",
    ecuName: "Garage ECU",
    carbonOffset: 3,
    gallonsSaved: 4,
    treesPlanted: 5,
    data: [],
  };
}

test("refresh stores a fresh snapshot and emits snapshot events", async () => {
  const clock = createClock("2026-03-20T10:00:00.000Z");
  const events = [];
  const store = new SnapshotStore({
    getResults: async () => createResult(),
    vars: createVars(),
    now: clock.now,
  });

  store.on("snapshot", (snapshot, reason) => {
    events.push({ snapshot, reason });
  });

  const snapshot = await store.refresh("manual");

  assert.equal(snapshot.generatedAt, "2026-03-20T10:00:00.000Z");
  assert.equal(snapshot.isStale, false);
  assert.equal(events.length, 1);
  assert.equal(events[0].reason, "manual");
});

test("failed refresh after a success returns stale snapshot with lastError", async () => {
  const clock = createClock("2026-03-20T10:00:00.000Z");
  let shouldFail = false;
  const store = new SnapshotStore({
    getResults: async () => {
      if (shouldFail) {
        throw new Error("ECU offline");
      }

      return createResult();
    },
    vars: createVars(),
    now: clock.now,
  });

  await store.refresh("manual");

  shouldFail = true;
  clock.advanceMs(12000);
  const snapshot = await store.refresh("manual");

  assert.equal(snapshot.lastError.message, "ECU offline");
  assert.equal(snapshot.isStale, true);
  assert.equal(snapshot.lastSuccessAt, "2026-03-20T10:00:00.000Z");
});

test("getSnapshotOrRefresh performs the first refresh lazily", async () => {
  let calls = 0;
  const store = new SnapshotStore({
    getResults: async () => {
      calls += 1;
      return createResult();
    },
    vars: createVars(),
  });

  await store.getSnapshotOrRefresh();
  await store.getSnapshotOrRefresh();

  assert.equal(calls, 1);
});

test("startPolling schedules recurring refreshes and stopPolling clears them", async () => {
  const timers = [];
  const cleared = [];
  const store = new SnapshotStore({
    getResults: async () => createResult(),
    vars: createVars(),
    setIntervalFn(callback, interval) {
      const timer = { callback, interval };
      timers.push(timer);
      return timer;
    },
    clearIntervalFn(timer) {
      cleared.push(timer);
    },
  });

  store.startPolling();
  store.startPolling();
  assert.equal(timers.length, 1);
  assert.equal(timers[0].interval, 5000);

  store.stopPolling();
  assert.equal(cleared.length, 1);
  assert.equal(cleared[0], timers[0]);
});