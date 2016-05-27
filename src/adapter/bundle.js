define([
    'legacyRegistry',
    './directives/MCTView'
], function (legacyRegistry, MCTView) {
    legacyRegistry.register('src/adapter', {
        "extensions": {
            "directives": [
                {
                    key: "mctView",
                    implementation: MCTView,
                    depends: ["newViews[]"]
                }
            ]
        }
    });
});
