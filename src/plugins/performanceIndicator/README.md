# URL Indicator
Adds an indicator which shows the number of frames that the browser is able to render per second. This is a useful proxy for the maximum number of updates that any telemetry display can perform per second. This may be useful during performance testing, but probably should not be enabled by default. 

This indicator adds adds about 3% points to CPU usage in the Chrome task manager.

## Installation
```js
openmct.install(openmct.plugins.PerformanceIndicator());
```