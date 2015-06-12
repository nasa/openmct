/*global define */

define(
    [
        './DrawWebGL',
        './Draw2D'
    ],
    function (DrawWebGL, Draw2D) {

        var CHARTS = [
            DrawWebGL,
            Draw2D
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
                for (var i = 0; i < CHARTS.length; i++) {
                    try {
                        return new CHARTS[i](canvas);
                    } catch (e) {
                        $log.warn([
                            "Could not instantiate chart",
                            CHARTS[i].name,
                            ";",
                            e.message
                        ].join(" "));
                    }
                }
                $log.warn("Cannot initialize mct-chart.");
                return undefined;
            }
        };
    }
);