
# Server side filtering in Open MCT

## Introduction

In Open MCT, filters can be constructed to filter out telemetry data on the server side. This is useful for reducing the amount of data that needs to be sent to the client. For example, in [Open MCT for MCWS](https://github.com/NASA-AMMOS/openmct-mcws/blob/e8846d325cc3f659d8ad58d1d24efaafbe2b6bb7/src/constants.js#L115), they can be used to filter realtime data from recorded data. In the [Open MCT YAMCS plugin](https://github.com/akhenry/openmct-yamcs/blob/9c4ed03e23848db3215fdb6a988ba34b445a3989/src/providers/events.js#L44), we can use them to filter incoming event data by severity.

## Installing the filter plugin

You'll need to install the filter plugin first. For example:

```js
openmct.install(openmct.plugins.Filters(['telemetry.plot.overlay', 'table']));
```

will install the filters plugin and have it apply to overlay plots and tables. You can see an example of this in the [Open MCT YAMCS plugin](https://github.com/akhenry/openmct-yamcs/blob/9c4ed03e23848db3215fdb6a988ba34b445a3989/example/index.js#L58).

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

This will define a filter that allows an operator to choose one (due to `singleSelectionThreshold` being `true`) of the three possible values. The `comparator` property defines how the filter will be applied to the telemetry data.
Setting `singleSelectionThreshold` to `false` will render the `possibleValues` as a series of checkboxes. Removing the `possibleValues` property will render the filter as a text box, allowing the operator to enter a value to filter on.

Note that how the filter is interpreted is ultimately decided by the individual telemetry providers.

## Implementing a filter in a telemetry provider

Implementing a filter requires two parts:

- First, one needs to add the filter implementation to the [subscribe](https://github.com/nasa/openmct/blob/5df7971438acb9e8b933edda2aed432b1b8bb27d/src/api/telemetry/TelemetryAPI.js#L366) method in your telemetry provider. The filter will be passed to you in the `options` argument. You can either add the filter to your telemetry subscription request, or filter manually as new messages appears. An example of the latter is [shown in the YAMCS plugin for Open MCT](https://github.com/akhenry/openmct-yamcs/blob/9c4ed03e23848db3215fdb6a988ba34b445a3989/src/providers/events.js#L95).

- Second, one needs to add the filter implementation to the [request](https://github.com/nasa/openmct/blob/5df7971438acb9e8b933edda2aed432b1b8bb27d/src/api/telemetry/TelemetryAPI.js#L318) method in your telemetry provider. The filter again will be passed to you in the `options` argument. You can either add the filter to your telemetry request, or filter manually after the request is made. An example of the former is [shown in the YAMCS plugin for Open MCT](https://github.com/akhenry/openmct-yamcs/blob/9c4ed03e23848db3215fdb6a988ba34b445a3989/src/providers/historical-telemetry-provider.js#L171).

## Using filters

If you installed the plugin to have it apply to `table`, create a Telemetry Table in Open MCT and drag your telemetry object that contains the filter to it. Then click "Edit", and notice the "Filter" tab in the inspector. It allows operator to either select a "Global Filter", or a regular filter. The "Global Filter" will apply for all telemetry objects in the table, while the regular filter will only apply to the telemetry object that it is defined on.