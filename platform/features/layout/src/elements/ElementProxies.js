/*global define*/

define(
    ['./TelemetryProxy', './ImageProxy', './LineProxy', './BoxProxy', './TextProxy'],
    function (TelemetryProxy, ImageProxy, LineProxy, BoxProxy, TextProxy) {
        "use strict";

        return {
            "fixed.telemetry": TelemetryProxy,
            "fixed.line": LineProxy,
            "fixed.box": BoxProxy,
            "fixed.image": ImageProxy,
            "fixed.text": TextProxy
        };
    }
);