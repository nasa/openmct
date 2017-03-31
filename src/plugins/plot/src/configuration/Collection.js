/*global define, Promise*/

define([
    'lodash',
    'EventEmitter',
    './Model',
    '../lib/extend'
], function (
    _,
    EventEmitter,
    Model,
    extend
) {
    'use strict';

    function Collection(models) {
        if (models) {
            this.models = models.map(this.modelFn, this);
        } else {
            this.models = [];
        }
    }

    _.extend(Collection.prototype, EventEmitter.prototype);

    Collection.extend = extend;

    Collection.prototype.modelClass = Model;

    Collection.prototype.modelFn = function (model) {
        if (model instanceof this.modelClass) {
            return model;
        }
        return new this.modelClass(model);
    };

    Collection.prototype.first = function () {
        return this.at(0);
    };

    Collection.prototype.forEach = function (iteree, context) {
        this.models.forEach(iteree, context);
    };

    Collection.prototype.map = function (iteree, context) {
        return this.models.map(iteree, context);
    };

    Collection.prototype.filter = function (iteree, context) {
        return this.models.filter(iteree, context);
    };

    Collection.prototype.size = function () {
        return this.models.length;
    };

    Collection.prototype.at = function (index) {
        return this.models[index];
    };

    Collection.prototype.add = function (model) {
        model = this.modelFn(model);
        var index = this.models.length;
        this.models.push(model);
        this.emit('add', model, index);
    };

    Collection.prototype.insert = function (model, index) {
        model = this.modelFn(model);
        this.models.splice(index, 0, model);
        this.emit('add', model, index + 1);
    };

    Collection.prototype.indexOf = function (model) {
        return _.findIndex(
            this.models,
            function (m) { return m === model; }
        );
    };

    Collection.prototype.remove = function (model) {
        var index = this.indexOf(model);
        if (index === -1) {
            throw new Error('model not found in collection.');
        }
        this.models.splice(index, 1);
        this.emit('remove', model, index);
    };

    Collection.prototype.destroy = function (model) {
        this.forEach(function (m) {
            m.destroy();
        });
    };

    return Collection;
});
