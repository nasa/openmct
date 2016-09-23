define([], function () {
    function ActionRegistry() {
        this.providers = [];
    }

    ActionRegistry.prototype.get = function (context) {
        return this.providers.filter(function (provider) {
            return provider.appliesTo(context);
        });
    };

    ActionRegistry.prototype.addProvider = function (provider) {
        this.providers.push(provider);
    };

    return ActionRegistry;
});
