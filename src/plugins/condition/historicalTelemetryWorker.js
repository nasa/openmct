import { makeKeyString } from '../../api/objects/object-utils.js';

function sortTelemetriesByDate(historicalTelemetriesPool) {
  const historicalTelemetryDateMap = new Map();
  historicalTelemetriesPool.forEach((historicalTelemetryList) => {
    const { historicalTelemetry, domainObject } = historicalTelemetryList;
    const { identifier } = domainObject;
    const telemetryIdentifier = makeKeyString(identifier);
    historicalTelemetry.forEach((historicalTelemetryItem) => {
      if (!historicalTelemetryDateMap.get(historicalTelemetryItem.utc)) {
        const telemetryMap = new Map();
        telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
        historicalTelemetryDateMap.set(historicalTelemetryItem.utc, telemetryMap);
      } else {
        const telemetryMap = historicalTelemetryDateMap.get(historicalTelemetryItem.utc);
        telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
        historicalTelemetryDateMap.set(historicalTelemetryItem.utc, telemetryMap);
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
