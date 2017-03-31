/*global define,console */

define(
    [
        './DrawWebGL',
        './Draw2D'
    ],
    function (DrawWebGL, Draw2D) {

        var CHARTS = [
                {
                    MAX_INSTANCES: 16,
                    API: DrawWebGL,
                    ALLOCATIONS: []
                },
                {
                    MAX_INSTANCES: Number.MAX_INFINITY,
                    API: Draw2D,
                    ALLOCATIONS: []
                }
            ];

        /**
         * Draw loader attaches a draw API to a canvas element and returns the
         * draw API.
         */
        return {
            /**
             * Return the first draw API available.  Returns
             * `undefined` if a draw API could not be constructed.
             *.
             * @param {CanvasElement} canvas - The canvas eelement to attach
                      the draw API to.
             */
            getDrawAPI: function (canvas) {
                var api;

                CHARTS.forEach(function (CHART_TYPE) {
                    if (api) {
                        return;
                    }
                    if (CHART_TYPE.ALLOCATIONS.length >=
                        CHART_TYPE.MAX_INSTANCES) {
                        return;
                    }
                    try {
                        api = new CHART_TYPE.API(canvas);
                        CHART_TYPE.ALLOCATIONS.push(api);
                    } catch (e) {
                        console.warn([
                            "Could not instantiate chart",
                            CHART_TYPE.API.name,
                            ";",
                            e.message
                        ].join(" "));
                    }
                });

                if (!api) {
                    console.warn("Cannot initialize mct-chart.");
                }
                return api;
            },

            releaseDrawAPI: function (api) {
                CHARTS.forEach(function (CHART_TYPE) {
                    if (api instanceof CHART_TYPE.API) {
                        CHART_TYPE.ALLOCATIONS.splice(CHART_TYPE.ALLOCATIONS.indexOf(api), 1);
                    }
                });
            }
        };
    }
);
