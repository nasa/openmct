To use this bundle, add the following paths to /main.js -
'./platform/features/conductor/bundle',
'./example/msl/bundle',

An example plugin that integrates with public data from the Curiosity rover. 
The data shown used by this plugin is published by the Centro de 
Astrobiología (CSIC-INTA) at http://cab.inta-csic.es/rems/

Fetching data from this source requires a cross-origin request which will 
fail on most modern browsers due to restrictions on such requests. As such, 
it is proxied through a local proxy defined in app.js. In order to use this 
example you will need to run app.js locally.

This example shows integration with an historical telemetry source, as 
opposed to a real-time data source that is streaming back current information 
about the state of a system. This example is atypical of a historical data 
source in that it fetches all data in one request. The server infrastructure 
of an historical telemetry source should ideally allow queries bounded by 
time and other data attributes.

