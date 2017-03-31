/*global define*/

define([

], function (

) {
    'use strict';

    function extend(props) {
        var parent = this,
            child,
            Surrogate;

        if (props && props.hasOwnProperty('constructor')) {
            child = props.constructor;
        } else {
            child = function () { return parent.apply(this, arguments); };
        }

        Object.keys(parent).forEach(function copyStaticProperties(propKey) {
            child[propKey] = parent[propKey];
        });

        // Surrogate allows inheriting from parent without invoking constructor.
        Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        if (props) {
            Object.keys(props).forEach(function copyInstanceProperties(key) {
                child.prototype[key] = props[key];
            });
        }

        child.__super__ = parent.prototype;

        return child;
    }

    return extend;
});
