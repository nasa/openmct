define([], function () {
    function ActionRegistry() {
        this.providers = [];
    }

    ActionRegistry.prototype.get = function (context) {
        return this.providers.filter(function (provider) {
            return provider.appliesTo(context);
        }).map(function (provider) {
            return provider.get(context);
        }).reduce(function (a, b) {
            return Array.isArray(b) ? a.concat(b) : a.concat([b]);
        }, []);
    };

    ActionRegistry.prototype.register = function (provider) {
        this.providers.push(provider);
    };

    return ActionRegistry;
});
