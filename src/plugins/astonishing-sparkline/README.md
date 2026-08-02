Astonishing Sparkline plugin for Open MCT

What it is
- A small JavaScript plugin that provides an interactive, animated sparkline view for telemetry-capable domain objects.
- Pure JS + CSS, minimal dependencies.
- Best used for telemetry streams (numeric values).

Where to put it (suggested)
- src/plugins/astonishing-sparkline/index.js
- src/plugins/astonishing-sparkline/styles.css

Install
1) Copy files into your fork under the suggested folder.
2) Import and install the plugin in your main application entry, e.g. src/main.js:

   import astonishingSparkline from './plugins/astonishing-sparkline/index.js';
   import './plugins/astonishing-sparkline/styles.css'; // or add to your global CSS bundle

   // where you create/open openmct
   openmct.install(astonishingSparkline({
     // optional: customize visual parameters
     maxSamples: 400,
     lineColor: '#00e0a3',
     bgColor: '#071025'
   }));

3) Rebuild your app (npm run build / npm start as appropriate).

Usage
- Open a telemetry-capable object (e.g., a telemetry stream). The view provider should appear in the view menu as "Astonishing Sparkline".
- Select it to open the animated view. If your Open MCT version hides the provider from the menu, you can add the view programmatically or register an object type.

Notes & Compatibility
- The plugin calls openmct.telemetry.subscribe; different Open MCT versions have slightly differing telemetry APIs (some return an unsubscribe function directly; some return a subscription object). The plugin attempts to handle common variants, but you may need to adapt unsubscribing to your Open MCT version.
- If you want this to be a selectable view type in the object-type configuration (so it shows as a layout card type), add a type/legacy extension pointing at this provider in your app's configuration.
- For advanced features (tooltips, zoom, multi-trace), extend telemetryCallback parsing and drawing routines.
