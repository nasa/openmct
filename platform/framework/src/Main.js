/*global define, requirejs*/

requirejs.config({
    "shim": {
        "../lib/angular.min": {
            "exports": "angular"
        }
    }
});

define(
    [
        'require',
        '../lib/es6-promise-2.0.0.min',
        '../lib/angular.min'
    ],
    function (require, es6promise, angular) {
        "use strict";

        var injector = angular.injector(['ng']);

        // Polyfill Promise, in case browser does not natively provide Promise
        window.Promise = window.Promise || es6promise.Promise;

        injector.invoke(['$http', function ($http) {
            return $http.get('bundles.json').then(function (b) {
                console.log(b);
            });
        }]);
    }
);