/**
 * Orbital Tracking Plugin for Open MCT
 *
 * Provides real-time satellite orbital tracking and visualization within
 * Open MCT. Uses TLE (Two-Line Element) data from CelesTrak and SGP4
 * propagation via satellite.js to compute satellite positions.
 *
 * Features:
 *   - Real-time satellite position tracking (latitude, longitude, altitude, speed)
 *   - 2D ground track visualization with orbital footprint
 *   - Support for multiple satellite groups (ISS, GPS, Weather, Starlink, etc.)
 *   - Integration with Open MCT's time conductor for historical playback
 *   - Telemetry tables and plots for satellite position data
 *
 * Object hierarchy:
 *   Orbital Tracking (root)
 *   ├── Space Stations (ISS, Tiangong, etc.)
 *   ├── Brightest Satellites
 *   ├── GPS Operational
 *   ├── Weather Satellites
 *   ├── Galileo
 *   ├── Science Satellites
 *   └── Starlink (sample)
 *
 * @see https://github.com/nasa/openmct/issues/1645
 * @see https://celestrak.org/NORAD/elements/
 * @see https://github.com/shashwatak/satellite-js
 */

import OrbitalDataService from './OrbitalDataService.js';
import OrbitalObjectProvider, { ORBITAL_NAMESPACE } from './OrbitalObjectProvider.js';
import OrbitalCompositionProvider from './OrbitalCompositionProvider.js';
import OrbitalTelemetryProvider from './OrbitalTelemetryProvider.js';
import OrbitalViewProvider from './OrbitalViewProvider.js';

export default function OrbitalPlugin() {
  return function install(openmct) {
    const dataService = new OrbitalDataService();
    const objectProvider = new OrbitalObjectProvider(dataService);
    const compositionProvider = new OrbitalCompositionProvider(dataService);
    const telemetryProvider = new OrbitalTelemetryProvider(dataService);
    const viewProvider = new OrbitalViewProvider(dataService);

    // Register domain object types
    openmct.types.addType('orbital.root', {
      name: 'Orbital Tracking',
      description: 'Real-time satellite orbital tracking',
      cssClass: 'icon-object'
    });

    openmct.types.addType('orbital.group', {
      name: 'Satellite Group',
      description: 'A group of tracked satellites',
      cssClass: 'icon-folder'
    });

    openmct.types.addType('orbital.satellite', {
      name: 'Satellite',
      description: 'A tracked satellite with real-time position telemetry',
      cssClass: 'icon-telemetry'
    });

    // Register providers
    openmct.objects.addProvider(ORBITAL_NAMESPACE, objectProvider);
    openmct.composition.addProvider(compositionProvider);
    openmct.telemetry.addProvider(telemetryProvider);

    // Register the ground track view
    openmct.objectViews.addProvider(viewProvider);

    // Add orbital tracking as a root object
    openmct.objects.addRoot({
      namespace: ORBITAL_NAMESPACE,
      key: 'root'
    });
  };
}
