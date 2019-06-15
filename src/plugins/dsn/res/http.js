(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.http = factory(root);
    }
})(this, function (root) {

    'use strict';

    var exports = {};

    var generateResponse = function (req) {
        var response = {
            data: req.responseText,
            status: req.status,
            request: req
        };
        if (req.getResponseHeader('Content-Type').indexOf('application/json') !== -1) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var xhr = function (type, url, data) {
        var promise = new Promise(function (resolve, reject) {
            var XHR = XMLHttpRequest || ActiveXObject;
            var request = new XHR('MSXML2.XMLHTTP.3.0');

            request.open(type, url, true);
            request.onreadystatechange = function () {
                var req;
                if (request.readyState === 4) {
                    req = generateResponse(request);
                    if (request.status >= 200 && request.status < 300) {
                        resolve(req);
                    } else {
                        reject(req);
                    }
                }
            };
            request.send(data);
        });
        return promise;
    };

    exports.get = function (src) {
        return xhr('GET', src);
    };

    exports.put = function (url, data) {
        return xhr('PUT', url, data);
    };

    exports.post = function (url, data) {
        return xhr('POST', url, data);
    };

    exports.delete = function (url) {
        return xhr('DELETE', url);
    };

    return exports;
});
