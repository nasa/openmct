/*global define*/

define(
    ['./TelemetryProxy', './ElementProxy', './LineProxy'],
    function (TelemetryProxy, ElementProxy, LineProxy) {
        "use strict";

        return {
            "fixed.telemetry": TelemetryProxy,
            "fixed.line": LineProxy,
            "fixed.box": ElementProxy,
            "fixed.image": ElementProxy,
            "fixed.text": ElementProxy
        };
    }
);