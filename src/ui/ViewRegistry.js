define([], function () {
    /**
     * A ViewRegistry maintains the definitions for different kinds of views
     * that may occur in different places in the user interface.
     * @interface ViewRegistry
     * @memberof module:openmct
     */
    function ViewRegistry() {
        this.providers = [];
    }

    ViewRegistry.prototype.get = function (item) {
        return this.providers.filter(function (provider) {
            return provider.canView(item);
        });
    };

    /**
     * Register a new type of view.
     *
     * @param {module:openmct.ViewProvider} provider the provider for this view
     * @method addProvider
     * @memberof module:openmct.ViewRegistry#
     */
    ViewRegistry.prototype.addProvider = function (provider) {
        this.providers.push(provider);
    };

    return ViewRegistry;

});
