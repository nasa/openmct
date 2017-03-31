define([
], function (
) {

    var CONFIG_STORE = {};

    function ConfigStore() {
        this.store = {};
        this.tracking = {};
    }
    ConfigStore.prototype.track = function (id) {
        if (!this.tracking[id]) {
            this.tracking[id] = 0;
        }
        this.tracking[id] += 1;
    };

    ConfigStore.prototype.untrack = function (id) {
        this.tracking[id] -= 1;
        if (this.tracking[id] <= 0) {
            delete this.tracking[id];
            this.store[id].destroy();
            delete this.store[id];
        }
    }

    ConfigStore.prototype.add = function (id, config) {
        this.store[id] = config;
    };

    ConfigStore.prototype.get = function (id) {
        return this.store[id];
    };

    var STORE = new ConfigStore();

    return STORE;
});
