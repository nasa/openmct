define([
    './TimeConductorService'
], function (TimeConductorService) {
    return function ConductorAPIPlugin() {
        return function install(openmct) {
            openmct.legacyExtension("services", {
                "key": "timeConductorService",
                "implementation": TimeConductorService,
                "depends": [
                    "openmct"
                ]
            });
        }
    }
});