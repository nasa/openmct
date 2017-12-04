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

    function Model(options) {
        if (!options) {
            options = {};
        }
        this.id = options.id;
        this.model = options.model;
        this.collection = options.collection;
        var defaults = this.defaults(options);
        if (!this.model) {
            this.model = options.model = defaults;
        } else {
            _.defaultsDeep(this.model, defaults);
        }
        this.initialize(options);
    }

    _.extend(Model.prototype, EventEmitter.prototype);
    eventHelpers.extend(Model.prototype);

    Model.extend = extend;

    Model.prototype.idAttr = 'id';

    Model.prototype.defaults = function (options) {
        return {};
    };

    Model.prototype.initialize = function (model) {

    };

    /**
     * Destroy the model, removing all listeners and subscriptions.
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
