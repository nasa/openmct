import { evaluate } from 'mathjs';

onconnect = function (e) {
  const port = e.ports[0];
  console.debug('🧮 Comps Math Worker connected');

  port.onmessage = function (event) {
    console.debug('🧮 Comps Math Worker message:', event);
    const { type, id, data, expression } = event.data;
    if (type === 'calculate') {
      try {
        const result = data.map((point) => {
          // Using Math.js to evaluate the expression against the data
          return { ...point, value: evaluate(expression, point) };
        });
        port.postMessage({ type: 'response', id, result });
      } catch (error) {
        port.postMessage({ type: 'error', id, error: error.message });
      }
    } else if (type === 'init') {
      port.postMessage({ type: 'ready' });
    } else {
      port.postMessage({ type: 'error', id, error: 'Invalid message type' });
    }
  };
};
