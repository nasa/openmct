define(
  [
    './URLIndicator'
  ],
  function URLIndicatorPlugin(URLIndicator) {

    return function (opts) {
        return function install(openmct) {
            var simpleIndicator = openmct.indicators.simpleIndicator();
            openmct.indicators.add(simpleIndicator);

            return new URLIndicator(opts, openmct, simpleIndicator);
        };
    };
});
