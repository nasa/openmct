define([
    'legacyRegistry',
    './directives/MCTView',
    './services/Instantiate',
    './capabilities/APICapabilityDecorator',
    './policies/AdapterCompositionPolicy'
], function (
    legacyRegistry,
    MCTView,
    Instantiate,
    APICapabilityDecorator,
    AdapterCompositionPolicy
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
            ],
            policies: [
                {
                    category: "composition",
                    implementation: AdapterCompositionPolicy,
                    depends: [ "mct" ]
                }
            ]
        }
    });
});
