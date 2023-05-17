
# Server side filtering in OpenMCT

## Introduction

In OpenMCT, filters can be constructed to filter out telemetry data on the server side. This is useful for reducing the amount of data that needs to be sent to the client. For example, in [OpenMCT for MCWS](https://github.com/NASA-AMMOS/openmct-mcws/blob/main/src/constants.js#L115), they can be used to filter realtime data from recorded data. In the [OpenMCT YAMCS plugin](https://github.com/akhenry/openmct-yamcs/blob/master/src/providers/events.js), we can use them to filter incoming event data by severity.

## Defining a filter

To define a filter, you'll need to add a new `filter` property to the domain object's `telemetry` metadata underneath the `values` array. For example, if you have a domain object with a `telemetry` metadata that looks like this:

```js
{
    key: 'fruit',
    name: 'Types of fruit',
    filters: [{
        singleSelectionThreshold: true,
        comparator: 'equals',
        possibleValues: [
            { name: 'Apple', value: 'apple' },
            { name: 'Banana', value: 'banana' },
            { name: 'Orange', value: 'orange' }
        ]
    }]
}
```

This will define a filter that allows an operator to choose one (due to `singleSelectionThreshold` being `true`) of the three possible values. The `comparator` property defines how the filter will be applied to the telemetry data. How the filter is interpreted is defined by the individual telemetry providers.

## Implementing a filter in a telemetry provider

Implementing a filter requires two parts.

- First, one needs to add the filter implementation to the [subscribe](https://github.com/nasa/openmct/blob/master/src/api/telemetry/TelemetryAPI.js#L366) method in your telemetry provider. The filter will be passed to you in the `options` argument. You can either add the filter to your telemetry subscription request, or filter manually as new messages appears. An example of the latter is [shown in the YAMCS plugin for OpenMCT](https://github.com/akhenry/openmct-yamcs/blob/master/src/providers/events.js).

- Second, one needs to add the filter implementation to the [request](https://github.com/nasa/openmct/blob/master/src/api/telemetry/TelemetryAPI.js#L318) method in your telemetry provider. The filter again will be passed to you in the `options` argument. You can either add the filter to your telemetry request, or filter manually after the request is made. An example of the former is [shown in the YAMCS plugin for OpenMCT](https://github.com/akhenry/openmct-yamcs/blob/master/src/providers/historical-telemetry-provider.js#L148).