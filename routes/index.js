const express = require("express");
const router = express.Router();
const snapshotStore = require("../components/snapshot-store");

/* GET home page. */
router.get("/", async function (req, res, next) {
  try {
    const result = await snapshotStore.getSnapshotOrRefresh();
    res.render("index", result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
