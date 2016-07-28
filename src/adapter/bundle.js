define([
    'legacyRegistry',
    './actions/ActionDialogDecorator',
    './directives/MCTView',
    './services/Instantiate',
    './capabilities/APICapabilityDecorator'
], function (
    legacyRegistry,
    ActionDialogDecorator,
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
                        "mct"
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
                },
                {
                    type: "decorator",
                    provides: "actionService",
                    implementation: ActionDialogDecorator
                }
            ]
        }
    });
});
