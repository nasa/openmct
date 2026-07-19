# Summary Widget Plugin
Summary widgets can be used to provide visual indication of state based on telemetry data. They allow rules to be 
defined that can then be used to change the appearance of the summary widget element based on data. For example, a 
summary widget could be defined that is green when a temperature reading is between `0` and `100` centigrade, red when 
it's above `100`, and orange when it's below `0`.

## Installation
```js
openmct.install(openmct.plugins.SummaryWidget());
```