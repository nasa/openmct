define([
    'legacyRegistry',
    './directives/MCTView'
], function (legacyRegistry, MCTView) {
    legacyRegistry.register('adapter', {
        "extensions": {
            "directives": [
                {
                    key: "mctView",
                    implementation: MCTView,
                    depends: "newViews[]"
                }
            ]
        }
    });
});
