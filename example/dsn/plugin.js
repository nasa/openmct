/**
 * Deep Space Network (DSN) Telemetry Plugin for Open MCT
 *
 * Integrates real-time telemetry from NASA's Deep Space Network into Open MCT.
 * Data is sourced from the public DSN Now XML feed, updated every 5 seconds.
 *
 * Object hierarchy:
 *   Deep Space Network (root)
 *   ├── Goldstone (GDSCC) - California, USA
 *   │   ├── DSS14, DSS24, DSS25, DSS26
 *   ├── Madrid (MDSCC) - Spain
 *   │   ├── DSS53, DSS54, DSS55, DSS56, DSS63, DSS65
 *   └── Canberra (CDSCC) - Australia
 *       ├── DSS34, DSS35, DSS36, DSS43
 *
 * Each dish provides telemetry: azimuth, elevation, signal data rates,
 * signal power, spacecraft target, range, and round-trip light time.
 *
 * @see https://eyes.nasa.gov/dsn/dsn.html
 * @see https://github.com/nasa/openmct/issues/1656
 */

import DSNDataService from './DSNDataService.js';
import DSNObjectProvider, { DSN_NAMESPACE } from './DSNObjectProvider.js';
import DSNCompositionProvider from './DSNCompositionProvider.js';
import DSNTelemetryProvider from './DSNTelemetryProvider.js';

export default function DSNPlugin() {
  return function install(openmct) {
    const dataService = new DSNDataService();
    const objectProvider = new DSNObjectProvider(dataService);
    const compositionProvider = new DSNCompositionProvider(dataService);
    const telemetryProvider = new DSNTelemetryProvider(dataService);

    // Register domain object types
    openmct.types.addType('dsn.network', {
      name: 'DSN Network',
      description: 'NASA Deep Space Network',
      cssClass: 'icon-dictionary'
    });

    openmct.types.addType('dsn.station', {
      name: 'DSN Station',
      description: 'Deep Space Communications Complex',
      cssClass: 'icon-folder'
    });

    openmct.types.addType('dsn.dish', {
      name: 'DSN Dish',
      description: 'Deep Space Network Antenna',
      cssClass: 'icon-telemetry'
    });

    // Register the object provider for the 'dsn' namespace
    openmct.objects.addProvider(DSN_NAMESPACE, objectProvider);

    // Register composition provider (defines parent-child relationships)
    openmct.composition.addProvider(compositionProvider);

    // Register telemetry provider
    openmct.telemetry.addProvider(telemetryProvider);

    // Add DSN as a root object in the tree
    openmct.objects.addRoot({
      namespace: DSN_NAMESPACE,
      key: 'root'
    });
  };
}
