/*global define, Promise*/

define([
    'lodash',
    'EventEmitter',
    '../lib/extend',
    '../lib/eventHelpers'
], function (
    _,
    EventEmitter,
    extend,
    eventHelpers
) {
    'use strict';

    function Model(model) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (!model) {
            model = {};
        }
        args.unshift(model);
        this.model = model;
        _.defaultsDeep(model, this.defaults.apply(this, args));
        this.initialize.apply(this, args);
    }

    _.extend(Model.prototype, EventEmitter.prototype);
    eventHelpers.extend(Model.prototype);

    Model.extend = extend;

    Model.prototype.idAttr = 'id';

    Model.prototype.defaults = function () {
        return {};
    };

    Model.prototype.initialize = function (model) {

    };

    /**
     * Destroy the series, removing all listeners and subscriptions.
     */
    Model.prototype.destroy = function () {
        this.emit('destroy');
        this.removeAllListeners();
    };

    Model.prototype.id = function () {
        return this.get(this.idAttr);
    };

    Model.prototype.get = function (attribute) {
        return this.model[attribute];
    };

    Model.prototype.has = function (attribute) {
        return _.has(this.model, attribute);
    };

    Model.prototype.set = function (attribute, value) {
        var oldValue = this.model[attribute];
        this.model[attribute] = value;
        this.emit('change', attribute, value, oldValue, this);
        this.emit('change:' + attribute, value, oldValue, this);
    };

    Model.prototype.unset = function (attribute) {
        var oldValue = this.model[attribute];
        delete this.model[attribute];
        this.emit('change', attribute, undefined, oldValue, this);
        this.emit('change:' + attribute, undefined, oldValue, this);
    };

    return Model;
});
