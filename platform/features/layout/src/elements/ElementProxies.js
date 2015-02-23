/*global define*/

define(
    ['./TelemetryProxy', './ElementProxy', './LineProxy', './BoxProxy', './TextProxy'],
    function (TelemetryProxy, ElementProxy, LineProxy, BoxProxy, TextProxy) {
        "use strict";

        return {
            "fixed.telemetry": TelemetryProxy,
            "fixed.line": LineProxy,
            "fixed.box": BoxProxy,
            "fixed.image": ElementProxy,
            "fixed.text": TextProxy
        };
    }
);