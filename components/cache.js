var mcache = require('memory-cache');
// from https://medium.com/the-node-js-collection/simple-server-side-cache-for-express-js-with-node-js-45ff296ca0f0
// This implements a basic server-side cache to the application, intended to avoid hammering
// the ECU at the other end. Not really needed but it's a nice speedup.

var cache = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url;
        let cachedBody = mcache.get(key);
        if (cachedBody) {
            console.log("Sending cached copy...");
            res.send(cachedBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                mcache.put(key, body, duration * 1000);
                res.sendResponse(body);
            }
        next();
        }
    }
}
  
module.exports = cache;