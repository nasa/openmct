/*global define*/

define(
    [],
    function () {
        'use strict';

        function Observable(initialValue) {
            this.value = initialValue;
            this.listeners = [];
        }

        Observable.prototype.get = function () {
            return this.value;
        };

        Observable.prototype.set = function (newValue) {
            this.value = newValue;
            this.listeners.forEach(function (listener) {
                listener(newValue);
            });
        };

        Observable.prototype.observe = function (listener) {
            var self = this;
            this.listeners.push(listener);
            listener(this.get());
            return function () {
                self.listeners = self.listeners.filter(function (fn) {
                    return fn !== listener;
                });
            };
        };

        return Observable;
    }
);
