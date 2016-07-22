define([
    'legacyRegistry',
    './directives/MCTView',
    './services/Instantiate',
    './capabilities/APICapabilityDecorator'
], function (
    legacyRegistry,
    MCTView,
    Instantiate,
    APICapabilityDecorator
) {
    legacyRegistry.register('src/adapter', {
        "extensions": {
            "directives": [
                {
                    key: "mctView",
                    implementation: MCTView,
                    depends: [
                        "newViews[]",
                        "PublicAPI"
                    ]
                }
            ],
            services: [
                {
                    key: "instantiate",
                    priority: "mandatory",
                    implementation: Instantiate,
                    depends: [
                        "capabilityService",
                        "identifierService",
                        "cacheService"
                    ]
                }
            ],
            components: [
                {
                    type: "decorator",
                    provides: "capabilityService",
                    implementation: APICapabilityDecorator,
                    depends: [
                        "$injector"
                    ]
                }
            ]
        }
    });
});
