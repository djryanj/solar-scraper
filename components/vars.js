/*
* vars.js
* provides some functions for getting variables that should be globally available
*
*/
const fs = require("fs");
const os = require("os");
const hostname = os.hostname();

// set these vars if you need to
const cacheLength = 270; // in seconds
const ecuHost = process.env.ECUHOST || "192.168.1.1";

const summaryUrl = "http://" + ecuHost + "/index.php/home";
const realTimeDataURL = "http://" + ecuHost + "/index.php/realtimedata";
const siteName = process.env.SITENAME || "Your House!";

const useMqtt = process.env.USE_MQTT || true;
const useHaMqtt = process.env.USE_HA_MQTT || true;
const mqttHost = "mqtt://" + (process.env.MQTT_HOST || "mqtt.thewulph.com")
const mqttPort = process.env.MQTT_PORT || "1883";
const mqttUserName = process.env.MQTT_USERNAME || null;
const mqttPass = process.env.MQTT_PASSWORD || null;
const mqttTopic = process.env.MQTT_TOPIC || "home/solar";
const haMqttTopic = process.env.HA_MQTT_TOPIC || "homeassistant";

function getLocalGit() {
    try {
        const rev = fs.readFileSync('.git/HEAD').toString();
        if (rev.indexOf(':') === -1) {
            return rev;
        } else {
            return fs.readFileSync('.git/' + rev.substring(5, rev.length - 1)).toString().substring(0, 7);
        }
    } catch (e) {
        return "missingBuildId";
    }
}

// when running in a docker container, pass in the BUILDID which will
// be equal to the short git commit ID. The .git folder is explicitly
// dockerignore'd, so the relevant information will not otherwise be
// available inside the container.

if (process.env.BUILDID) {
    var gitCommit = (process.env.BUILDID).toString().substring(0, 7);
} else {
    var gitCommit = getLocalGit();
}

const azureBuildNumber = process.env.BUILDNUMBER || "local";
const environment = process.env.SOURCEBRANCHNAME || "local";
const vers = process.env.npm_package_version + "-" + environment + "-" + gitCommit;

module.exports = {
    azureBuildNumber : azureBuildNumber,
    vers : vers,
    hostname : hostname,
    cacheLength : cacheLength,
    summaryUrl : summaryUrl,
    realTimeDataURL : realTimeDataURL,
    siteName : siteName,
    ecuHost : ecuHost,
    mqttHost : mqttHost,
    mqttPort : mqttPort,
    mqttPass : mqttPass,
    mqttUserName : mqttUserName,
    mqttTopic : mqttTopic,
    useMqtt : useMqtt,
    useHaMqtt: useHaMqtt,
    haMqttTopic : haMqttTopic,
}