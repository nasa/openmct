define([
], function (
) {

    var CONFIG_STORE = {};

    function ConfigStore() {
        this.store = {};
    }

    ConfigStore.prototype.add = function (id, config) {
        this.store[id] = config;
    };

    ConfigStore.prototype.get = function (id) {
        return this.store[id];
    };

    ConfigStore.prototype.remove = function (id) {
        delete this.store[id];
    };

    var STORE = new ConfigStore();

    return STORE;
});
