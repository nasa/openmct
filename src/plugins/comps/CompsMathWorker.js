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
        const result = telemetryForComps.map((point) => {
          // Using Math.js to evaluate the expression against the data
          return { ...point, value: evaluate(expression, point) };
        });
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
