# APSolar ECU Prometheus Exporter

An unofficial Prometheus exporter for APSolar ECU's written in node.js by [Ryan Jacobs](https://github.com/djryanj).

# About

Since most of us that have installed [APSolar ECU's](https://usa.apsystems.com/products/monitor/) in the home don't have access to their monitoring site or API to get information and may be curious about exporting generation and all other data provided by the ECU into something a bit more query-able (at the very least), this exporter scrapes the data from the ECU's local web page and provides a /metrics endpoint for Prometheus to scrape. 

It can also output the metrics to an MQTT server. This is useful for decoupling the scraper and Prometheus (or for consuming the metrics by something else). Note that in order to use the MQTT version of the metrics in Prometheus, you'll need some other bit of code running somewhere like [MQTTGateway for Prometheus](https://github.com/inuits/mqttgateway).

# Running

You will need to define at least the environment variable ECUHOST in order to run the image and ensure that port 3000 is forwarded somehow.

    docker run --env ECUHOST=<your-ecu-host-or-ip> -p 3000:3000 djryanj/solar-scraper:latest


## Environment Variables

Three environment variables exist:

    ECUHOST=<your-ecu-host-or-ip>
    SITENAME=your friendly site name
    PORT=<tcp-port-for-express>
  
 ECUHOST is the hostname or IP address of your APSolar ECU. Defaults to 192.168.1.1.
 SITENAME is a friendly name for your home; something like "Jacobs Home". This variable is not used in the metrics exposed. Defaults to "Your House!"
 PORT is the port to expose the webserver on inside the container. Defaults to 3000.

## Network

Exposes port 3000 by default. Change the PORT environment variable if you want to change it.

## Endpoints

The default index endpoint (e.g. http://docker-host:3000/) prints out all the data ingested by the scraper along with the site name environment variable to make it sorta pretty.

/metrics is the Prometheus-formatted metrics endpoint.

/json outputs the metrics as a JSON string, useful for consumption by a downstream API.

# Prometheus Config

Here is a sample config block for Prometheus:
```
- job_name: solar_ecu
  scrape_interval: 5m
  static_configs:
    - targets:
      - <hostname>