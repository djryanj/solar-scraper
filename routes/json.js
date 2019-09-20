const express = require("express");
const router = express.Router();
const getResults = require("../components/scraper");
const cache = require("../components/cache");
const vars = require("../components/vars");

/* GET json output page. */
router.get("/", cache(vars.cacheLength), async function(req, res, next) {
    try {
        const result = await getResults();
        result.version = vars.vers;
        result.hostname = vars.hostname;
        result.azureBuildNumber = vars.azureBuildNumber;
        result.ecuHost = vars.ecuHost;

        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
    } catch (e) {
        next(e);
    }  
});

module.exports = router;