import { makeKeyString } from '../../api/objects/object-utils.js';

function sortTelemetriesByDate(historicalTelemetriesPool) {
  const historicalTelemetryDateMap = new Map();
  historicalTelemetriesPool.forEach((historicalTelemetryList) => {
    const { historicalTelemetry, domainObject } = historicalTelemetryList;
    const { identifier } = domainObject;
    const telemetryIdentifier = makeKeyString(identifier);
    historicalTelemetry.forEach((historicalTelemetryItem) => {
      let telemetryTimestamp = historicalTelemetryItem.utc;
      if (historicalTelemetryItem.timestamp) {
        telemetryTimestamp = new Date(historicalTelemetryItem.timestamp)?.getTime();
      }
      if (!historicalTelemetryDateMap.get(telemetryTimestamp)) {
        const telemetryMap = new Map();
        telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
        historicalTelemetryDateMap.set(telemetryTimestamp, telemetryMap);
      } else {
        const telemetryMap = historicalTelemetryDateMap.get(telemetryTimestamp);
        telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
        historicalTelemetryDateMap.set(telemetryTimestamp, telemetryMap);
      }
    });
  });
  return historicalTelemetryDateMap;
}

self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === 'sortTelemetries') {
    const sortedTelemetries = sortTelemetriesByDate(data.historicalTelemetriesPool);
    self.postMessage({ type: 'result', data: sortedTelemetries });
  } else {
    self.postMessage({ type: 'error', error: 'Unknown message type' });
  }
};
