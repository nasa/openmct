# Autoflow View

This plugin provides the Autoflow View for domain objects in Open MCT. This view allows users to visualize the latest 
values of a collection of telemetry points in a condensed list.

## Installation
``` js
    openmct.install(openmct.plugins.AutoflowView({
        type: "telemetry.fixed"
    }));
```

## Options
* `type`: The object type to add the Autoflow View to. Currently supports a single value. If not provided, will make the 
Autoflow view available for all objects (which is probably not what you want).
