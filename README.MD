
# APSolar ECU Prometheus Exporter

A containerized data scraper for APSolar ECU's written in node.js by [Ryan Jacobs](https://github.com/djryanj). It has the following features:

* Prometheus metrics exporter

* JSON data endpoint

* MQTT data export

* Data export to MQTT that is follows the topic format required for auto-discovery in [Home Assistant](https://www.home-assistant.io/docs/mqtt/discovery/).

# About

Since most of us that have installed [APSolar ECU's](https://usa.apsystems.com/products/monitor/) in the home don't have access to APSolar's monitoring site or API to get information and may be curious about exporting generation and all other data provided by the ECU into something a bit more query-able (at the very least), this data scraper scrapes the data from the ECU's local web page and provides a number of methods to ingest that data.

This project started life as an unofficial Prometheus exporter for the data provided by the APSolar ECU as Prometheus was the time-series database of choice for me at the time (and it's a little easier to get started with for something simple like this vs. InfluxDB). It became apparent quickly that having the scraper provide a number of different data formats for whatever someone might want to do with it was the way to go, and so it grew a JSON endpoint and not one, but two [MQTT](#mqtt) data formats.

At this time, providing support for InfluxDB is being considered for a future release.

**NOTE:** The APSolar ECU (at this time) only updates the statistics every 5 minutes. As a result, the scraper will only scrape every 5 minutes. Repeated hits to the scraper will produce a cached copy for those 5 minutes. Please set any downstream ingestion to respect this time limit.

# Running

You will need to define at least the environment variable ECUHOST in order to run the image and ensure that port 3000 is forwarded somehow. Further configuration information is available below.

``docker run --env ECUHOST=<your-ecu-host-or-ip> -p 3000:3000 djryanj/solar-scraper:latest``

## Configuration

Configuration is done via environment variables only.

### Configurable Environment Variables

The following environment variables directly affect the operation of the scraper. Only one is required to be set; the rest are optional depending on what features you want to do (and the configuration required for them). There are defaults for all.

| Variable | Required | Description | Default |
|--|--|--|--|
|``ECUHOST`` | Yes| IP or hostname of the APSolar ECU to scrape. | 192.168.1.1 |
|``PORT`` | No |The port that the container listens on (internally). Be sure to change the port Docker forwards if you change this. | 3000
|``USE_MQTT`` | No | Set to **true** if you want to use generic MQTT. See the [MQTT](#mqtt) section for more information. **Be sure to also set MQTT_HOST**!! | False
| ``USE_HA_MQTT`` | No | Set to **true** if you want to use Home Assistant to auto-discover solar information via MQTT. Note that USE_MQTT and USE_HA_MQTT are independent; you do not need to set USE_MQTT to true if USE_HA_MQTT is true. **Be sure to also set MQTT_HOST**!! |  False
| ``MQTT_HOST`` | No | Set to the IP address or DNS name of your MQTT server. Both USE_MQTT and USE_HA_MQTT use the same host. **IMPORTANT!** The default host could potentially expose information to a public server you don't want exposed. Be sure to set this if you set USE_MQTT or USE_HA_MQTT to true! **NOTE:** At this time, providing a self-signed certificate file for TLS communications is not supported. If your MQTT server uses PKI from a well-known certificate authority such as letsencrypt (be sure that the WHOLE chain is sent), it should work. At this time, self-signed cert behaviour is untested. | test.mosquitto.org
|``MQTT_PORT`` | No | The TCP port on which to connect to the MQTT server. | 1883
|``MQTT_USERNAME`` | No | If you need to supply a username for your MQTT server, set it here. | null/unset (works for anonymous servers)
| ``MQTT_PASSWORD`` | No | If you need to supply a password for your MQTT server, set it here. **IMPORTANT!** This will be visible in the logs and if you get container information from the Docker host. You could provide this via Docker secrets. | null/unset (works for anonymous servers)
| ``MQTT_TOPIC`` | No | Base topic for standard MQTT data. See [MQTT](#mqtt) section for more information. | home/solar
|``HA_MQTT_TOPIC`` | No | Base topic for Home Assistant auto-discovery. This must match the base topic in your Home Assistant configuration.yaml. **Note:** this can only be a single label (e.g. ``homeassistant`` or ``hass``) or auto-discovery will fail.| homeassistant


### Informational Environment Variables

The following environment variables provide information into the scraper but do not affect operation beyond the cosmetic (they are exported with metrics and are visible on the browseable home page). None of these are required.

| Variable | Description | Default |
|--|--|--|
|``SITENAME`` | A friendly site name. Mostly visible on the home page of the scraper but also exported with metrics.| Your House!
| ``BUILDID`` | The BUILDID is intended to be passed in from an automation pipeline such as Azure DevOps and should be equivalent to the git hash (this was mostly used during development; a future release may hide this for production builds). The BUILDID can be read from the local .git directory, but that is not present in the Docker container. |missingBuildId (when nothing is passed to Docker or the .git directory is not present locally); otherwise the 7-character git hash of the 
| ``BUILDNUMBER`` | The BUILDNUMBER is intended to be passed in from an automation pipeline such as Azure DevOps and should be equivalent to the automated build number, e.g. 20190910.1. | local
| ``SOURCEBRANCHNAME`` | The SOURCEBRANCHNAME is intended to be passed in from an automation pipeline such as Azure DevOps and should be equivalent to the git branch that the container was built from, e.g. master. | local

## Network

Exposes port tcp/3000 by default. Change the ``PORT`` environment variable if you want to change it. Leverage something like [jwilder/nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy/) to automatically forward a hostname from the Docker host's port 80 or 443 to this container.  

# Endpoints

## Default
There is a default cosmetic endpoint at ``/`` (e.g. http://docker-host:3000/) that shows all data in a human-readable form. 

## Prometheus
Prometheus expects an endpoint at ``/metrics``, which is where it is. In addition to the custom metrics provided by this scraper, there are node.js-specific metrics exported as well that are not presented here. You can browse the endpoint if you wish.

All metrics are prefixed by ``solar_``. The list of metrics is below (including the prefix for clarity).

### Metrics

#### Generic Metrics

|Metric|Description  |
|--|--|
|``solar_total_generated``| Total solar power generated over the lifetime of the array in kilowatt hours (kWh).|
|``solar_daily_generated``| Total solar power generated today in kilowatt hours (kWh).|
|``solar_current_total_power``| Current solar power output in watts (W).|
|``solar_carbon_offset``| Estimated carbon offset in kg of CO2 saved over the lifetime of the solar array.|
|``solar_trees_planted``| Estimated carbon offset by the equivalent number of trees that have been planted over the lifetime of the solar array.|
|``solar_gallons_offset``| Estimated carbon offset in gallons of gasoline saved over the lifetime of the solar array.|
|``solar_scraper_version_info{version="<version>",hostname="<hostname>",buildId="<buildId>",ecuHost="<ecu-host>"}``| Version and other information. |

#### Per-Panel Metrics

The following metrics will be one per panel in your array, labelled by inverter ID (see the Administration->ID Management or the Real Time Data links on the ECU to see what inverters are configured). Inverters that have multiple panels connected (e.g. the YC500/600 or YC1000) will have an -A, -B etc. appended to the end.

|Metric|Description  |
|--|--|
|``solar_panel_power{inverterId=<inverterId>}``| Current power output of the panel in watts (W).|
|``solar_panel_grid_frequency{inverterId=<inverterId>}``| Current grid frequency measured by the panel in hertz (Hz).|
|``solar_inverter_temperature{inverterId=<inverterId>}``| Current inverter temperature in °C.|
|``solar_inverter_grid_voltage{inverterId=<inverterId>}``| Current grid voltage output by the inverter in volts A/C (V).|

## MQTT

Although only one MQTT host is allowed, you can output 2 kinds of MQTT data. One is more generically formatted and published when ``USE_MQTT`` is ``true``; the other is formatted for use by the [MQTT auto-discovery function in Home Assistant](https://www.home-assistant.io/docs/mqtt/discovery/), enabled by setting the ``USE_HA_MQTT`` environment variable to ``true``.

The generically-formatted data could be suitable for consumption into Prometheus through something like  [MQTTGateway for Prometheus](https://github.com/inuits/mqttgateway). This would achieve a decoupling of the scraper and Prometheus, which could be useful in large systems with many ECU's (though I doubt such a thing would need this software ;) ).

The ``MQTT_TOPIC`` and ``HA_MQTT_TOPIC`` environment variables, set to ``home/solar`` and ``homeassistant`` respectively by default, are the base topics upon which the rest of the topic labels are built.

**IMPORTANT:** Do not use more than a single label (e.g. ``homeassistant`` or ``hass``) for the Home Assistant auto-discovery base topic or auto-discovery will fail.

### Metrics - Generic Topic

The following metrics are exported to the ``MQTT_TOPIC`` (e.g. ``home/solar``):

#### Generic Metrics

|Metric|Description  |
|--|--|
|``/dailyGen``| Total solar power generated today in kilowatt hours (kWh).|
|``/totalGen``| Total solar power generated over the lifetime of the array in kilowatt hours (kWh).|
|``/currentSystemPower``|Current solar power output in watts (W).|
|``/treesPlanted``| Estimated carbon offset by the equivalent number of trees that have been planted over the lifetime of the solar array.|
|``/gallonsSaved``| Estimated carbon offset in gallons of gasoline saved over the lifetime of the solar array.|
|``/carbonOffset``| Estimated carbon offset in kg of CO2 saved over the lifetime of the solar array.|
|``/scraper/version``| Running version number of the scraper software.|
|``/scraper/hostname``| Hostname on which the software is running.|
|``/scraper/azureBuildNumber``| Pipeline build number.|
|``/scraper/ecuHost``| Configured ECU IP address or hostname.|

#### Per-Panel Metrics

The following topics will be one per panel in your array, labelled by inverter ID (see the Administration->ID Management or the Real Time Data links on the ECU to see what inverters are configured). Inverters that have multiple panels connected (e.g. the YC500/600 or YC1000) will have an -A, -B etc. appended to the end.

|Metric|Description  |
|--|--|
|``/panels/<inverterId>/currentPower``| Current power output of the panel in watts (W).|
|``/panels/<inverterId>/gridVoltage``| Current grid voltage output by the inverter in volts A/C (V).|
|``/panels/<inverterId>/temperature``|Current inverter temperature in °C.|
|``/panels/<inverterId>/gridFrequency``|Current grid frequency measured by the panel in hertz (Hz).|
|``/ping``|Unix-timestamp for the last published MQTT data.|

### Metrics - Home Assistant Topic

The following metrics are exported to the ``HA_MQTT_TOPIC`` (e.g. ``homeassistant``).
All of these will be discovered as ``sensor`` within Home Assistant, due to the topics' full format e.g. ``homeassistant/sensor/totalGen/state``. For more information, see [MQTT auto-discovery function in Home Assistant](https://www.home-assistant.io/docs/mqtt/discovery/). Therefore, all of the below are relative to ``HA_MQTT_TOPIC/sensor``.

**Note:** For brevity, the ``/state`` suffix for each topic is not added on to the topic name (this is usually not seen in Home Assistant anyway). ``/config`` topics are not presented.

#### General Topics

|Topic|Data|Home Assistant Sensor Name|
|--|--|--|
|``/carbonOffset/carbon``| Estimated carbon offset in kg of CO2 saved over the lifetime of the solar array. | ``sensor.carbon_offset_kg_of_co2``|
|``/carbonOffset/trees``| Estimated carbon offset by the equivalent number of trees that have been planted over the lifetime of the solar array. | ``sensor.carbon_offset_trees_planted``|
|``/carbonOffset/gallons``| Estimated carbon offset in gallons of gasoline saved over the lifetime of the solar array. | ``sensor.carbon_offset_gallons_of_gasoline_saved``|
|``/dailyGen``| Total solar power generated today in kilowatt hours (kWh). | ``sensor.power_generated_today``|
|``/currGen``| Current solar power output in watts (W). | ``sensor.current_solar_power_output``|
|``/totalGen``| Total solar power generated over the lifetime of the array in kilowatt hours (kWh). | ``sensor.lifetime_solar_power_generated``|

#### Per-Panel Topics

Each of the below metrics will exist one per panel/inverter ID.  The panel # for sensors should be the same every run, unless additional inverters are added. 

|Topic|Data|Home Assistant Sensor Name|
|--|--|--|
|``/solar_panel_<inverterID>/power``| Current power output of the panel in watts (V). | ``sensor.solar_panel_<#>_power``|
|``/solar_panel_<inverterID>/temperature``| Current inverter temperature in °C. | ``sensor.solar_panel_<#>_temperature``|
|``/solar_panel_<inverterID>/frequency``| Current grid frequency measured by the panel in hertz (Hz). | ``sensor.solar_panel_<#>_frequency``|
|``/solar_panel_<inverterID>/voltage``| Current grid voltage output by the inverter in volts A/C (V). | ``sensor.solar_panel_<#>_voltage``|

The following additional topics are published:

* A JSON-formatted string of all data is published to ``HA_MQTT_TOPIC/json`` (e.g not at ``HA_MQTT_TOPIC/sensor/json``. Unsure at this time how useful that is, but Home Assistant can read JSON-formatted MQTT topics.
* ``MQTT_TOPIC/ping`` is always published if either ``USE_MQTT`` or ``USE_HA_MQTT`` is ``true``


**NOTE:** Scraper versioning info is not currently published to a Home Assistant topic. This is a decision I made because at this time, I can't see a reason to include it. It's mostly useless information for most users, more so for Home Assistant users because of the way the data is surfaced and likely to be used in Home Assistant, and if it's desired it's available on the other topic for manual addition anyway.

## JSON/API

The scraper will return a JSON-formatted string by browsing ``/json``, e.g. http://docker-host:3000/json. This is useful for consumption into a wide variety of downstream things.

There is no other API available. 

# Prometheus Config

Here is a sample config block for Prometheus:

```
- job_name: solar_ecu
  scrape_interval: 5m
  static_configs:
  - targets:
    - <hostname>
```
