const express = require("express");
const router = express.Router();
const getResults = require("../scraper");

/* GET home page. */
router.get("/", async function(req, res, next) {
  try {
    const result = await getResults();
    result.version = process.env.npm_package_version;
    res.render("index", result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
