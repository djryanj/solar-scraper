const express = require("express");
const router = express.Router();
const getResults = require("../scraper");
const os = require("os");
const hostname = os.hostname();
const fs = require("fs");

function getLocalGit() {
  try {
    const rev = fs.readFileSync('.git/HEAD').toString();
    if (rev.indexOf(':') === -1) {
        return rev;
    } else {
      return fs.readFileSync('.git/' + rev.substring(5, rev.length-1)).toString().substring(0,7);
    }
  } catch (e) {
    return "missingBuildId";
  }
  
}

if (process.env.BUILDID) {
  var gitCommit = (process.env.BUILDID).toString().substring(0,7);
} else {
  var gitCommit = getLocalGit();
}

const azureBuildNumber = process.env.BUILDNUMBER || "local";
const environment = process.env.SOURCEBRANCHNAME || "local";
const vers = process.env.npm_package_version + "-" + environment + "-" + gitCommit;

/* GET home page. */
router.get("/", async function(req, res, next) {
  try {
    const result = await getResults();
    result.version = vers;
    result.hostname = hostname;
    result.azureBuildNumber = azureBuildNumber;
    res.render("index", result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
