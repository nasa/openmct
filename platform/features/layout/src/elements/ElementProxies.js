/*global define*/

define(
    ['./TelemetryProxy', './ElementProxy'],
    function (TelemetryProxy, ElementProxy) {
        "use strict";

        return {
            "fixed.telemetry": TelemetryProxy,
            "fixed.line": ElementProxy,
            "fixed.box": ElementProxy,
            "fixed.image": ElementProxy,
            "fixed.text": ElementProxy
        };
    }
);