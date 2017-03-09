define([
    './UTCTimeFormat',
    './LocalClock'
], function (
    UtcTimeFormat,
    LocalClock
) {
    return function UtcTimeSystemPlugin(options) {
        return function install(openmct) {
            openmct.telemetry.addFormat(new UtcTimeFormat());
            openmct.conductor.addTimeSystem({
                key: 'utc',
                name: 'UTC',
                timeFormat: 'utc',
                durationFormat: 'duration',
                utcBased: true
            });
            openmct.conductor.addTickSource(new LocalClock());
        }
    }
});