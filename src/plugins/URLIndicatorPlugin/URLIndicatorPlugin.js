define(
  [
    './URLIndicator'
  ],
  function URLIndicatorPlugin(URLIndicator) {

    return function (opts) {
        return function install(openmct) {
            var simpleIndicator = openmct.indicators.simpleIndicator();
            var urlIndicator = new URLIndicator(opts, openmct, simpleIndicator);
            
            openmct.indicators.add(simpleIndicator);

            return urlIndicator;
        };
    };
});
