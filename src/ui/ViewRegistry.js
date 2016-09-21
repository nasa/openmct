define(['zepto'], function () {
    function ViewRegistry() {
        this.providers = [];
    }

    ViewRegistry.prototype.get = function (item) {
        return this.providers.filter(function (provider) {
            return provider.canView(item);
        });
    };

    ViewRegistry.prototype.addProvider = function (provider) {
        this.providers.push(provider);
    };

    return ViewRegistry;

});
