const EventEmitter = require("events");
const scrapeResults = require("./scraper");
const defaultVars = require("./vars");

class SnapshotStore extends EventEmitter {
  constructor(options = {}) {
    super();
    this.getResults = options.getResults || scrapeResults;
    this.vars = options.vars || defaultVars;
    this.now = options.now || (() => new Date());
    this.setIntervalFn = options.setIntervalFn || setInterval;
    this.clearIntervalFn = options.clearIntervalFn || clearInterval;
    this.snapshot = null;
    this.lastSuccessAt = null;
    this.lastError = null;
    this.refreshPromise = null;
    this.pollTimer = null;
  }

  buildSnapshot(result) {
    const generatedAt = this.now().toISOString();

    return {
      ...result,
      version: this.vars.vers,
      releaseVersion: this.vars.releaseVersion,
      gitSha: this.vars.gitSha,
      hostname: this.vars.hostname,
      ecuHost: this.vars.ecuHost,
      generatedAt,
      lastSuccessAt: generatedAt,
      lastError: null,
      isStale: false,
    };
  }

  getSnapshot() {
    if (!this.snapshot) {
      return null;
    }

    return {
      ...this.snapshot,
      lastError: this.lastError,
      isStale: this.isStale(),
    };
  }

  isStale() {
    if (!this.lastSuccessAt) {
      return true;
    }

    return (
      this.now().getTime() - this.lastSuccessAt.getTime() >
      this.vars.scrapeIntervalMs * 2
    );
  }

  async refresh(reason = "manual") {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const result = await this.getResults();
        const snapshot = this.buildSnapshot(result);

        this.snapshot = snapshot;
        this.lastSuccessAt = new Date(snapshot.generatedAt);
        this.lastError = null;
        this.emit("snapshot", snapshot, reason);

        return this.getSnapshot();
      } catch (error) {
        this.lastError = {
          message: error.message,
          at: this.now().toISOString(),
        };

        this.emit("refreshError", error, reason);

        if (this.snapshot) {
          return this.getSnapshot();
        }

        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async getSnapshotOrRefresh() {
    if (this.snapshot) {
      return this.getSnapshot();
    }

    return this.refresh("on-demand");
  }

  startPolling() {
    if (this.pollTimer) {
      return;
    }

    void this.refresh("startup").catch((error) => {
      console.error("Initial ECU scrape failed:", error.message);
    });

    this.pollTimer = this.setIntervalFn(() => {
      void this.refresh("interval").catch((error) => {
        console.error("Scheduled ECU scrape failed:", error.message);
      });
    }, this.vars.scrapeIntervalMs);
  }

  stopPolling() {
    if (!this.pollTimer) {
      return;
    }

    this.clearIntervalFn(this.pollTimer);
    this.pollTimer = null;
  }
}

const snapshotStore = new SnapshotStore();

module.exports = snapshotStore;
module.exports.SnapshotStore = SnapshotStore;
