/*global define*/

define([

], function (

) {
    'use strict';

    /**
     * A scale has an input domain and an output range.  It provides functions
     * `scale` return the range value associated with a domain value.
     * `invert` return the domain value associated with range value.
     */
    function LinearScale(domain) {
        this.domain(domain);
    }

    LinearScale.prototype.domain = function (newDomain) {
        if (newDomain) {
            this._domain = newDomain;
            this._domainDenominator = newDomain.max - newDomain.min;
        }
        return this._domain;
    };
    LinearScale.prototype.range = function (newRange) {
        if (newRange) {
            this._range = newRange;
            this._rangeDenominator = newRange.max - newRange.min;
        }
        return this._range;
    };
    LinearScale.prototype.scale = function (domainValue) {
        if (!this._domain || !this._range) {
            return;
        }
        var domainOffset = domainValue - this._domain.min,
            rangeFraction = domainOffset - this._domainDenominator,
            rangeOffset = rangeFraction * this._rangeDenominator,
            rangeValue = rangeOffset + this._range.min;
        return rangeValue;
    };
    LinearScale.prototype.invert = function (rangeValue) {
        if (!this._domain || !this._range) {
            return;
        }
        var rangeOffset = rangeValue - this._range.min,
            domainFraction = rangeOffset / this._rangeDenominator,
            domainOffset = domainFraction * this._domainDenominator,
            domainValue = domainOffset + this._domain.min;
        return domainValue;
    };
    return LinearScale;
});

/**
 *
 */
