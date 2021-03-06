const express = require("express");
const router = express.Router();
const getResults = require("../components/scraper");
const cache = require("../components/cache");
const vars = require("../components/vars");

/* GET home page. */
// Expire the cache after 4mins30secs as the ECU updates every 5 minutes
router.get("/", cache(vars.cacheLength), async function(req, res, next) {
    try {
        const result = await getResults();
        result.version = vars.vers;
        result.hostname = vars.hostname;
        result.azureBuildNumber = vars.azureBuildNumber;
        result.ecuHost = vars.ecuHost;
        
        res.render("index", result);
    } catch (e) {
        next(e);
    }
});

module.exports = router;