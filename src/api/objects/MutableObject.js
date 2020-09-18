/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
    'objectUtils',
    'lodash'
], function (
    utils,
    _
) {
    const ANY_OBJECT_EVENT = "mutation";

    /**
     * The MutableObject wraps a DomainObject and provides getters and
     * setters for
     * @param eventEmitter
     * @param object
     * @interface MutableObject
     */
    function MutableObject(eventEmitter, object) {
        this.eventEmitter = eventEmitter;
        this.object = object;
        this.unlisteners = [];
    }

    function qualifiedEventName(object, eventName) {
        const keystring = utils.makeKeyString(object.identifier);

        return [keystring, eventName].join(':');
    }

    MutableObject.prototype.stopListening = function () {
        this.unlisteners.forEach(function (unlisten) {
            unlisten();
        });
        this.unlisteners = [];
    };

    /**
     * Observe changes to this domain object.
     * @param {string} path the property to observe
     * @param {Function} callback a callback to invoke when new values for
     *        this property are observed
     * @method on
     * @memberof module:openmct.MutableObject#
     */
    MutableObject.prototype.on = function (path, callback) {
        const fullPath = qualifiedEventName(this.object, path);
        const eventOff =
            this.eventEmitter.off.bind(this.eventEmitter, fullPath, callback);

        this.eventEmitter.on(fullPath, callback);
        this.unlisteners.push(eventOff);
    };

    /**
     * Modify this domain object.
     * @param {string} path the property to modify
     * @param {*} value the new value for this property
     * @method set
     * @memberof module:openmct.MutableObject#
     */
    MutableObject.prototype.set = function (path, value) {
        _.set(this.object, path, value);
        _.set(this.object, 'modified', Date.now());

        const handleRecursiveMutation = function (newObject) {
            this.object = newObject;
        }.bind(this);

        //Emit wildcard event
        this.eventEmitter.emit(qualifiedEventName(this.object, '*'), this.object);
        //Emit a general "any object" event
        this.eventEmitter.emit(ANY_OBJECT_EVENT, this.object);

        this.eventEmitter.on(qualifiedEventName(this.object, '*'), handleRecursiveMutation);
        //Emit event specific to property
        this.eventEmitter.emit(qualifiedEventName(this.object, path), value);
        this.eventEmitter.off(qualifiedEventName(this.object, '*'), handleRecursiveMutation);
    };

    return MutableObject;
});
