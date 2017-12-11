define(
  [
    './URLIndicator'
  ],
  function URLIndicatorPlugin(URLIndicator) {

    return function (opts) {
        return function install(openmct) {
            return new URLIndicator(opts, openmct);
        };
    };
});
