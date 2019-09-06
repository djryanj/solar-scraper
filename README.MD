# APSolar ECU Prometheus Exporter

An unofficial Prometheus exporter for APSolar ECU's written in node.js by [Ryan Jacobs](https://github.com/djryanj).

# About

Since most of us that have installed [APSolar ECU's](https://usa.apsystems.com/products/monitor/) in the home don't have access to their monitoring site or API to get information and may be curious about exporting generation and all other data provided by the ECU into something a bit more query-able (at the very least), this exporter scrapes the data from the ECU's local web page and provides a /metrics endpoint for Prometheus to scrape. 

# Running

You will need to define at least the environment variable ECUHOST in order to run the image and ensure that port 3000 is forwarded somehow.

    docker run --env ECUHOST=<your-ecu-host-or-ip> -p 3000:3000 djryanj/solar-scraper:latest


## Environment Variables

Two environment variables exist:

    ECUHOST=<your-ecu-host-or-ip>
    SITENAME=your friendly site name
  
 ECUHOST is the hostname or IP address of your APSolar ECU
 SITENAME is a friendly name for your home; something like "Jacobs Home". This variable is not used in the metrics exposed.

## Network

Exposes port 3000.

## Endpoints

The default index endpoint (e.g. http://docker-host:3000/) prints out all the data ingested by the scraper along with the site name environment variable to make it sorta pretty.

/metrics is the Prometheus-formatted metrics endpoint.

# Prometheus Config

Here is a sample config block for Prometheus:
```
- job_name: solar_ecu
  scrape_interval: 5m
  static_configs:
    - targets:
      - <hostname>