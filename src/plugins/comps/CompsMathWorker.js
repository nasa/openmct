import { evaluate } from 'mathjs';

// eslint-disable-next-line no-undef
onconnect = function (e) {
  const port = e.ports[0];
  console.debug('🧮 Comps Math Worker connected');

  port.onmessage = function (event) {
    console.debug('🧮 Comps Math Worker message:', event);
    try {
      const { type, callbackID, telemetryForComps, expression } = event.data;
      if (type === 'calculateRequest') {
        const result = calculateRequest(telemetryForComps, expression);
        port.postMessage({ type: 'calculationRequestResult', callbackID, result });
      } else if (type === 'calculateSubscription') {
        const result = calculateSubscription(telemetryForComps, expression);
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

function calculateSubscription(telemetryForComps, expression) {
  const dataFrame = getFullDataFrame(telemetryForComps);
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
  if (!firstDataSet || !secondDataSet) {
    return sumResults;
  }

  for (const [utc, item1] of firstDataSet.entries()) {
    if (secondDataSet.has(utc)) {
      const item2 = secondDataSet.get(utc);
      const output = evaluate(expression, { a: item1.sin, b: item2.sin });
      sumResults.push({ utc, output });
    }
  }
  return sumResults;
}
