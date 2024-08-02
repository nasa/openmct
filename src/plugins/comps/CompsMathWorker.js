import { evaluate } from 'mathjs';

onconnect = function (e) {
  const port = e.ports[0];
  console.debug('🧮 Comps Math Worker connected');

  port.onmessage = function (event) {
    console.debug('🧮 Comps Math Worker message:', event);
    const { type, callbackID, telemetryForComps, expression } = event.data;
    if (type === 'calculateRequest' || type === 'calculateSubscription') {
      try {
        // the reply type is different for request and subscription
        const replyType =
          type === 'calculateRequest'
            ? 'calculationRequestResult'
            : 'calculationSubscriptionResult';
        const result = calculate(telemetryForComps, expression);
        port.postMessage({ type: replyType, callbackID, result });
      } catch (error) {
        port.postMessage({ type: 'error', callbackID, error: error.message });
      }
    } else if (type === 'init') {
      port.postMessage({ type: 'ready' });
    } else {
      port.postMessage({ type: 'error', callbackID, error: 'Invalid message type' });
    }
  };
};

function calculate(telemetryForComps, expression) {
  const dataSet1 = Object.values(telemetryForComps)[0];
  const dataSet2 = Object.values(telemetryForComps)[1];

  // Organize data by utc for quick access
  const utcMap1 = new Map(dataSet1.map((item) => [item.utc, item.sin]));
  const utcMap2 = new Map(dataSet2.map((item) => [item.utc, item.sin]));

  const sumResults = [];

  // Iterate over the first dataset and check for matching utc in the second dataset
  for (const [utc, sin1] of utcMap1.entries()) {
    if (utcMap2.has(utc)) {
      const sin2 = utcMap2.get(utc);
      const sumSin = evaluate(expression, { a: sin1, b: sin2 });
      sumResults.push({ utc, sumSin });
    }
  }
  return sumResults;
}
