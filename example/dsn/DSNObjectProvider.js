/**
 * DSN Object Provider
 * Provides domain objects for the DSN hierarchy:
 * DSN Network (root) > Stations > Dishes
 */

const DSN_NAMESPACE = 'dsn';

const STATIONS = [
  { key: 'gdscc', name: 'Goldstone', location: 'California, USA' },
  { key: 'mdscc', name: 'Madrid', location: 'Spain' },
  { key: 'cdscc', name: 'Canberra', location: 'Australia' }
];

export default class DSNObjectProvider {
  constructor(dataService) {
    this._dataService = dataService;
  }

  get(identifier) {
    if (identifier.key === 'root') {
      return Promise.resolve({
        identifier,
        name: 'Deep Space Network',
        type: 'dsn.network',
        location: 'ROOT'
      });
    }

    if (identifier.key.startsWith('station-')) {
      const stationKey = identifier.key.replace('station-', '');
      const station = STATIONS.find((s) => s.key === stationKey);

      return Promise.resolve({
        identifier,
        name: station ? `${station.name} (${station.key.toUpperCase()})` : stationKey,
        type: 'dsn.station',
        location: `${DSN_NAMESPACE}:root`,
        dsn: {
          stationKey: stationKey,
          location: station ? station.location : ''
        }
      });
    }

    if (identifier.key.startsWith('dish-')) {
      const dishName = identifier.key.replace('dish-', '');

      return Promise.resolve({
        identifier,
        name: dishName,
        type: 'dsn.dish',
        telemetry: {
          values: getDishTelemetryMetadata()
        }
      });
    }

    return Promise.reject(new Error(`Unknown DSN object: ${identifier.key}`));
  }
}

export function getDishTelemetryMetadata() {
  return [
    {
      key: 'timestamp',
      name: 'Timestamp',
      format: 'utc',
      hints: { domain: 1 }
    },
    {
      key: 'targetName',
      name: 'Spacecraft',
      format: 'string',
      hints: { label: 1 }
    },
    {
      key: 'activity',
      name: 'Activity',
      format: 'string'
    },
    {
      key: 'azimuthAngle',
      name: 'Azimuth (°)',
      format: 'number',
      formatString: '%0.2f',
      hints: { range: 3 }
    },
    {
      key: 'elevationAngle',
      name: 'Elevation (°)',
      format: 'number',
      formatString: '%0.2f',
      hints: { range: 4 }
    },
    {
      key: 'windSpeed',
      name: 'Wind Speed (km/h)',
      format: 'number',
      formatString: '%0.1f',
      hints: { range: 5 }
    },
    {
      key: 'downSignalDataRate',
      name: 'Down Data Rate (bps)',
      format: 'number',
      formatString: '%0.0f',
      hints: { range: 1 }
    },
    {
      key: 'downSignalPower',
      name: 'Down Power (dBm)',
      format: 'number',
      formatString: '%0.2f',
      hints: { range: 2 }
    },
    {
      key: 'downSignalBand',
      name: 'Down Band',
      format: 'string'
    },
    {
      key: 'upSignalPower',
      name: 'Up Power (kW)',
      format: 'number',
      formatString: '%0.2f'
    },
    {
      key: 'upSignalBand',
      name: 'Up Band',
      format: 'string'
    },
    {
      key: 'targetUplegRange',
      name: 'Range (km)',
      format: 'number',
      formatString: '%0.0f'
    },
    {
      key: 'targetRTLT',
      name: 'Round-Trip Light Time (s)',
      format: 'number',
      formatString: '%0.2f'
    },
    {
      key: 'isMSPA',
      name: 'MSPA',
      format: 'string'
    },
    {
      key: 'isDDOR',
      name: 'DDOR',
      format: 'string'
    }
  ];
}

export { DSN_NAMESPACE, STATIONS };
