/*global define*/

define(
    ['./TelemetryProxy'],
    function (TelemetryProxy) {
        "use strict";

        return {
            "fixed.telemetry": TelemetryProxy
        };
    }
);