import { evaluate } from 'mathjs';

// eslint-disable-next-line no-undef
onconnect = function (e) {
  const port = e.ports[0];
  console.debug('🧮 Comps Math Worker connected');

  port.onmessage = function (event) {
    console.debug('🧮 Comps Math Worker message:', event);
    try {
      const { type, callbackID, telemetryForComps, expression, parameters } = event.data;
      if (type === 'calculateRequest') {
        const result = calculateRequest(telemetryForComps, parameters, expression);
        port.postMessage({ type: 'calculationRequestResult', callbackID, result });
      } else if (type === 'calculateSubscription') {
        const result = calculateSubscription(telemetryForComps, parameters, expression);
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

function calculateSubscription(telemetryForComps, parameters, expression) {
  const dataFrame = getFullDataFrame(telemetryForComps);
  return calculate(dataFrame, parameters, expression);
}

function calculateRequest(telemetryForComps, parameters, expression) {
  const dataFrame = getFullDataFrame(telemetryForComps);
  return calculate(dataFrame, parameters, expression);
}

function calculate(dataFrame, parameters, expression) {
  const sumResults = [];
  // ensure all parameter keyStrings have corresponding telemetry data
  if (!expression) {
    return sumResults;
  }
  // take the first parameter keyString as the reference
  const referenceParameter = parameters[0];
  const otherParameters = parameters.slice(1);
  // iterate over the reference telemetry data
  const referenceTelemetry = dataFrame[referenceParameter.keyString];
  referenceTelemetry.forEach((referenceTelemetryItem) => {
    const scope = {
      [referenceParameter.name]: referenceTelemetryItem[referenceParameter.valueToUse]
    };
    const referenceTime = referenceTelemetryItem[referenceParameter.timeKey];
    // iterate over the other parameters to set the scope
    let missingData = false;
    otherParameters.forEach((parameter) => {
      const otherDataFrame = dataFrame[parameter.keyString];
      const otherTelemetry = otherDataFrame.get(referenceTime);
      if (!otherTelemetry) {
        missingData = true;
        return;
      }
      scope[parameter.name] = otherTelemetry[parameter.valueToUse];
    });
    if (missingData) {
      return;
    }
    const output = evaluate(expression, scope);
    sumResults.push({ [referenceParameter.timeKey]: referenceTime, output });
  });
  return sumResults;
}
