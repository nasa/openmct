/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    'lodash',
    'EventEmitter',
    '../objects/ObjectAPI',
    '../objects/object-utils'
], function (
    _,
    EventEmitter,
    ObjectAPI,
    objectUtils
) {
    /**
     * A CompositionProvider provides the underlying implementation of
     * composition-related behavior for certain types of domain object.
     *
     * @interface CompositionProvider
     * @memberof module:openmct
     * @augments EventEmitter
     */

    function makeEventName(domainObject, event) {
        return event + ':' + objectUtils.makeKeyString(domainObject.identifier);
    }

    function DefaultCompositionProvider() {
        EventEmitter.call(this);
    }

    DefaultCompositionProvider.prototype =
        Object.create(EventEmitter.prototype);

    /**
     * Check if this provider should be used to load composition for a
     * particular domain object.
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to check
     * @returns {boolean} true if this provider can provide
     *          composition for a given domain object
     * @memberof module:openmct.CompositionProvider#
     * @method appliesTo
     */
    DefaultCompositionProvider.prototype.appliesTo = function (domainObject) {
        return !!domainObject.composition;
    };

    /**
     * Load any domain objects contained in the composition of this domain
     * object.
     * @param {module:openmct.DomainObjcet} domainObject the domain object
     *        for which to load composition
     * @returns {Promise.<Array.<module:openmct.DomainObject>>} a promise for
     *          the domain objects in this composition
     * @memberof module:openmct.CompositionProvider#
     * @method load
     */
    DefaultCompositionProvider.prototype.load = function (domainObject) {
        return Promise.all(domainObject.composition.map(ObjectAPI.get));
    };

    DefaultCompositionProvider.prototype.on = function (
        domainObject,
        event,
        listener,
        context
    ) {
        // these can likely be passed through to the mutation service instead
        // of using an eventemitter.
        this.addListener(
            makeEventName(domainObject, event),
            listener,
            context
        );
    };

    DefaultCompositionProvider.prototype.off = function (
        domainObject,
        event,
        listener,
        context
    ) {
        // these can likely be passed through to the mutation service instead
        // of using an eventemitter.
        this.removeListener(
            makeEventName(domainObject, event),
            listener,
            context
        );
    };

    /**
     * Remove a domain object from another domain object's composition.
     *
     * This method is optional; if not present, adding to a domain object's
     * composition using this provider will be disallowed.
     *
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        which should have its composition modified
     * @param {module:openmct.DomainObject} child the domain object to remove
     * @memberof module:openmct.CompositionProvider#
     * @method remove
     */
    DefaultCompositionProvider.prototype.remove = function (domainObject, child) {
        // TODO: this needs to be synchronized via mutation
        var index = domainObject.composition.indexOf(child);
        domainObject.composition.splice(index, 1);
        this.emit(makeEventName(domainObject, 'remove'), child);
    };

    /**
     * Add a domain object to another domain object's composition.
     *
     * This method is optional; if not present, adding to a domain object's
     * composition using this provider will be disallowed.
     *
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        which should have its composition modified
     * @param {module:openmct.DomainObject} child the domain object to add
     * @memberof module:openmct.CompositionProvider#
     * @method add
     */
    DefaultCompositionProvider.prototype.add = function (domainObject, child) {
        // TODO: this needs to be synchronized via mutation
        domainObject.composition.push(child.key);
        this.emit(makeEventName(domainObject, 'add'), child);
    };

    return DefaultCompositionProvider;
});
