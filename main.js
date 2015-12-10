/*global require*/
(function (require, options) {
    'use strict';
    require.config({
        shim: {
            "platform/framework/lib/angular.min": {
                exports: "angular"
            },
            "platform/framework/lib/angular-route.min": {
                deps: ["platform/framework/lib/angular.min"]
            }
        }
    });
    require(["platform/framework/src/Main"]);
}(require));