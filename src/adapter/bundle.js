define([
    'legacyRegistry',
    './directives/MCTView',
    './services/Instantiate'
], function (
    legacyRegistry,
    MCTView,
    Instantiate
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
            ]
        }
    });
});
