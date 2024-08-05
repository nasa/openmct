import { evaluate } from 'mathjs';

onconnect = function (e) {
  const port = e.ports[0];
  console.debug('🧮 Comps Math Worker connected');

  port.onmessage = function (event) {
    console.debug('🧮 Comps Math Worker message:', event);
    try {
      const { type, callbackID, telemetryForComps, newTelemetry, expression } = event.data;
      if (type === 'calculateRequest') {
        const result = calculateRequest(telemetryForComps, expression);
        port.postMessage({ type: 'calculationRequestResult', callbackID, result });
      } else if (type === 'calculateSubscription') {
        const result = calculateSubscription(telemetryForComps, newTelemetry, expression);
        if (result.length) {
          port.postMessage({ type: 'calculationSubscriptionResult', callbackID, result });
        }
      } else if (type === 'init') {
        port.postMessage({ type: 'ready' });
      } else {
        throw new Error('Invalid message type');
      }
    } catch (error) {
      port.postMessage({ type: 'error', error });
    }
  };
};

function getFullDataFrame(telemetryForComps) {
  const dataFrame = {};
  Object.keys(telemetryForComps).forEach((key) => {
    const dataSet = telemetryForComps[key];
    const telemetryMap = new Map(dataSet.map((item) => [item.utc, item]));
    dataFrame[key] = telemetryMap;
  });
  return dataFrame;
}

function getReducedDataFrame(telemetryForComps, newTelemetry) {
  const reducedDataFrame = {};
  const fullDataFrame = getFullDataFrame(telemetryForComps);
  // we can assume (due to telemetryCollections) that newTelmetry has at most one key
  const newTelemetryKey = Object.keys(newTelemetry)[0];
  const newTelmetryData = newTelemetry[newTelemetryKey];
  // initalize maps for other telemetry
  Object.keys(telemetryForComps).forEach((key) => {
    if (key !== newTelemetryKey) {
      reducedDataFrame[key] = new Map();
    }
  });
  reducedDataFrame[newTelemetryKey] = new Map(
    Object.values(newTelmetryData).map((item) => {
      return [item.utc, item];
    })
  );

  // march through the new telemetry and look for corresponding telemetry in the other dataset
  newTelmetryData.forEach((value) => {
    const newTelemetryUtc = value.utc;
    Object.keys(telemetryForComps).forEach((otherKey) => {
      if (otherKey !== newTelemetryKey) {
        const otherDataSet = fullDataFrame[otherKey];
        if (otherDataSet.has(newTelemetryUtc)) {
          reducedDataFrame[otherKey].set(newTelemetryUtc, otherDataSet.get(newTelemetryUtc));
        }
      }
    });
  });
  return reducedDataFrame;
}

function calculateSubscription(telemetryForComps, newTelemetry, expression) {
  const dataFrame = getReducedDataFrame(telemetryForComps, newTelemetry);
  return calculate(dataFrame, expression);
}

function calculateRequest(telemetryForComps, expression) {
  const dataFrame = getFullDataFrame(telemetryForComps);
  return calculate(dataFrame, expression);
}

function calculate(dataFrame, expression) {
  const sumResults = [];
  // Iterate over the first dataset and check for matching utc in the other dataset
  const firstDataSet = Object.values(dataFrame)[0];
  const secondDataSet = Object.values(dataFrame)[1];

  for (const [utc, item1] of firstDataSet.entries()) {
    if (secondDataSet.has(utc)) {
      const item2 = secondDataSet.get(utc);
      const output = evaluate(expression, { a: item1.sin, b: item2.sin });
      sumResults.push({ utc, output });
    }
  }
  return sumResults;
}
