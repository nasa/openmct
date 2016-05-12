# Telemetry API - Overview

The Telemetry API provides basic methods for retrieving historical and realtime telemetry data, retrieving telemetry metadata, and registering additional telemetry providers.   

The Telemetry API also provides a set of helpers built upon these basics-- TelemetryFormatters help you format telemetry values for display purposes, LimitEvaluators help you display evaluate and display alarm states, while TelemetryCollections provide a method for seamlessly combining historical and realtime data, while supporting more advanced client side filtering and interactivity.


## Getting Telemetry Data


### `MCT.telemetry.request(domainObject, options)`

Request historical telemetry for a domain object.  Options allows you to specify filters (start, end, etc.), sort order, and strategies for retrieving telemetry (aggregation, latest available, etc.).

Returns a `Promise` for an array of telemetry values.

### `MCT.telemetry.subscribe(domainObject, callback, options)`

Subscribe to realtime telemetry for a specific domain object.  callback will be called whenever data is received from a realtime provider.  Options allows you to specify ???

## Understanding Telemetry

### `MCT.telemetry.getMetadata(domainObject)`

Retrieve telemetry metadata for a domain object.  Telemetry metadata helps you understand the sort of telemetry data a domain object can provide-- for instances, the possible enumerations or states, the units, and more.

### `MCT.telemetry.Formatter`

Telemetry formatters help you format telemetry values for display.  Under the covers, they use telemetry metadata to interpret your telemetry data, and then they use the format API to format that data for display.


### `MCT.telemetry.LimitEvaluator`

Limit Evaluators help you evaluate limit and alarm status of individual telemetry datums for display purposes without having to interact directly with the Limit API.  

## Adding new telemetry sources

### `MCT.telemetry.registerProvider(telemetryProvider)`

Register a telemetry provider with the telemetry service.  This allows you to connect alternative telemetry sources to   For more information, see the `MCT.telemetry.BaseProvider`

### `MCT.telemetry.BaseProvider`

The base provider is a great starting point for developers who would like to implement their own telemetry provider.  At the same time, you can implement your own telemetry provider as long as it meets the TelemetryProvider (see other docs).

## Other tools

### `MCT.telemetry.TelemetryCollection`

The TelemetryCollection is a useful tool for building advanced displays.  It helps you seamlessly handle both historical and realtime telemetry data, while making it easier to deal with large data sets and interactive displays that need to frequently requery data.



# API Reference (TODO)

* Telemetry Metadata
* Request Options
    -- start
    -- end
    -- sort
    -- ???
    -- strategies -- specify which strategies you want.  an array provides for fallback strategies without needing decoration.  Design fallbacks into API.

### `MCT.telemetry.request(domainObject, options)`
### `MCT.telemetry.subscribe(domainObject, callback, options)`
### `MCT.telemetry.getMetadata(domainObject)`
### `MCT.telemetry.Formatter`
### `MCT.telemetry.LimitEvaluator`
### `MCT.telemetry.registerProvider(telemetryProvider)`
### `MCT.telemetry.BaseProvider`
### `MCT.telemetry.TelemetryCollection`
