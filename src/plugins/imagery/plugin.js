define([
    './imageryViewProvider',
], function (
    ImageryViewProvider
) {
    return function plugin() {
        var type = 'imagery-layout';
        var IMAGE_SAMPLES = [
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18731.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18732.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18733.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18734.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18735.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18736.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18737.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18738.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18739.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18740.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18741.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18742.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18743.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18744.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18745.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18746.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18747.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18748.jpg"
        ];

        function pointForTimestamp(timestamp, name) {
            return {
                name: name,
                utc: Math.floor(timestamp / 5000) * 5000,
                url: IMAGE_SAMPLES[Math.floor(timestamp / 5000) % IMAGE_SAMPLES.length]
            };
        }

        var realtimeProvider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === type;
            },
            subscribe: function (domainObject, callback) {
                var interval = setInterval(function () {
                    callback(pointForTimestamp(Date.now(), domainObject.name));
                }, 5000);

                return function (interval) {
                    clearInterval(interval);
                };
            }
        };

        var historicalProvider = {
            supportsRequest: function (domainObject, options) {
                return domainObject.type === type
                    && options.strategy !== 'latest';
            },
            request: function (domainObject, options) {
                var start = options.start;
                var end = options.end;
                var data = [];
                while (start <= end && data.length < 5000) {
                    data.push(pointForTimestamp(start, domainObject.name));
                    start += 5000;
                }
                return Promise.resolve(data);
            }
        };

        var ladProvider = {
            supportsRequest: function (domainObject, options) {
                return domainObject.type === type &&
                    options.strategy === 'latest';
            },
            request: function (domainObject, options) {
                return Promise.resolve([pointForTimestamp(Date.now(), domainObject.name)]);
            }
        };

        return function install(openmct) {
            openmct.objectViews.addProvider(new ImageryViewProvider(openmct));

            openmct.types.addType(type, {
                name: "Imagery Layout",
                key: 'imagery-layout',
                creatable: true,
                description: "A flexible layout canvas that can display multiple objects in rows or columns.",
                cssClass: 'icon-image',
                initialize: function (domainObject) {
                    domainObject.composition = [],
                    domainObject.telemetry = {};
                    domainObject.telemetry.values =
                        openmct.time.getAllTimeSystems().map(function (timeSystem, index) {
                            return {
                                key: timeSystem.key,
                                name: timeSystem.name,
                                hints: {
                                    domain: index + 1
                                }
                            };
                        });
                    domainObject.telemetry.values.push({
                        name: 'Image',
                        key: 'url',
                        format: 'image',
                        hints: {
                            image: 1
                        }
                    });
                }
            });
            openmct.telemetry.addProvider(realtimeProvider);
            openmct.telemetry.addProvider(historicalProvider);
            openmct.telemetry.addProvider(ladProvider);
        };
    };
});
