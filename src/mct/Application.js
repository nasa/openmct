define([], function () {
    'use strict';

    function Application(plugins) {
        this.plugins = plugins || [];
    }

    Application.prototype.install = function (plugin) {
        this.plugins.push(plugin);
    };

    Application.prototype.uninstall = function (plugin) {
        this.plugins = this.plugins.filter(function (p ) {
            return p !== plugin;
        });
    };

    Application.prototype.run = function () {
        this.plugins.forEach(function (plugin) {
            plugin.initialize();
        });
        this.plugins.forEach(function (plugin) {
            plugin.activate();
        });
    };

    return Application;
});