/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
import _ from 'lodash';
import utils from './object-utils.js';
import EventEmitter from 'EventEmitter';

const ANY_OBJECT_EVENT = 'mutation';

/**
 * Wraps a domain object to keep its model synchronized with other instances of the same object.
 *
 * Creating a MutableDomainObject will automatically register listeners to keep its model in sync. As such, developers
 * should be careful to destroy MutableDomainObject in order to avoid memory leaks.
 *
 * All Open MCT API functions that provide objects will provide MutableDomainObjects where possible, except
 * `openmct.objects.get()`, and will manage that object's lifecycle for you. Calling `openmct.objects.getMutable()`
 * will result in the creation of a new MutableDomainObject and you will be responsible for destroying it
 * (via openmct.objects.destroy) when you're done with it.
 *
 * @typedef MutableDomainObject
 * @memberof module:openmct
 */
class MutableDomainObject {
    constructor(eventEmitter) {
        Object.defineProperties(this, {
            _globalEventEmitter: {
                value: eventEmitter,
                // Property should not be serialized
                enumerable: false
            },
            _instanceEventEmitter: {
                value: new EventEmitter(),
                // Property should not be serialized
                enumerable: false
            },
            _callbacksForPaths: {
                value: {},
                // Property should not be serialized
                enumerable: false
            },
            isMutable: {
                value: true,
                // Property should not be serialized
                enumerable: false
            }
        });
    }
    /**
     * BRAND new approach
     * - Register a listener on $_synchronize_model
     * - The $_synchronize_model event provides the path. Figure out whether the mutated path is equal to, or a parent of the observed path.
     * - If so, trigger callback with new value
     * - As an optimization, ONLY trigger if value has actually changed. Could be deferred until later?
     */

    $observe(path, callback) {
        let callbacksForPath = this._callbacksForPaths[path];
        if (callbacksForPath === undefined) {
            callbacksForPath = [];
            this._callbacksForPaths[path] = callbacksForPath;
        }

        callbacksForPath.push(callback);

        return function unlisten() {
            let index = callbacksForPath.indexOf(callback);
            callbacksForPath.splice(index, 1);
            if (callbacksForPath.length === 0) {
                delete this._callbacksForPaths[path];
            }
        }.bind(this);

    }
    $set(path, value) {
        _.set(this, path, value);

        if (path !== 'persisted' && path !== 'modified') {
            _.set(this, 'modified', Date.now());
        }

        //Emit secret synchronization event first, so that all objects are in sync before subsequent events fired.
        this._globalEventEmitter.emit(qualifiedEventName(this, '$_synchronize_model'), this);

        //Emit a general "any object" event
        this._globalEventEmitter.emit(ANY_OBJECT_EVENT, this);
        //Emit wildcard event, with path so that callback knows what changed
        this._globalEventEmitter.emit(qualifiedEventName(this, '*'), this, path, value);
    }

    $refresh(model) {
        const clone = JSON.parse(JSON.stringify(this));
        this._globalEventEmitter.emit(qualifiedEventName(this, '$_synchronize_model'), model);

        //Emit wildcard event
        this._globalEventEmitter.emit(qualifiedEventName(this, '*'), this, '*', this, clone);
    }

    $on(event, callback) {
        this._instanceEventEmitter.on(event, callback);

        return () => this._instanceEventEmitter.off(event, callback);
    }
    $updateListenersOnPath(updatedModel, mutatedPath, newValue, oldModel) {
        const isRefresh = mutatedPath === '*';

        Object.entries(this._callbacksForPaths).forEach(([observedPath, callbacks]) => {
            if (isChildOf(observedPath, mutatedPath)
                || isParentOf(observedPath, mutatedPath)) {
                let newValueOfObservedPath;

                if (observedPath === '*') {
                    newValueOfObservedPath = updatedModel;

                } else {
                    newValueOfObservedPath = _.get(updatedModel, observedPath);
                }

                if (isRefresh && observedPath !== '*') {
                    const oldValueOfObservedPath = _.get(oldModel, observedPath);
                    if (!_.isEqual(newValueOfObservedPath, oldValueOfObservedPath)) {
                        callbacks.forEach(callback => callback(newValueOfObservedPath));
                    }
                } else {
                    //Assumed to be different if result of mutation.
                    callbacks.forEach(callback => callback(newValueOfObservedPath));
                }
            }
        });
    }
    $synchronizeModel(updatedObject) {
        let clone = JSON.parse(JSON.stringify(updatedObject));
        utils.refresh(this, clone);
    }
    $destroy() {
        Object.keys(this._callbacksForPaths).forEach(key => delete this._callbacksForPaths[key]);
        this._instanceEventEmitter.emit('$_destroy');
        this._globalEventEmitter.off(qualifiedEventName(this, '$_synchronize_model'), this.$synchronizeModel);
        this._globalEventEmitter.off(qualifiedEventName(this, '*'), this.$updateListenersOnPath);
    }

    static createMutable(object, mutationTopic) {
        let mutable = Object.create(new MutableDomainObject(mutationTopic));
        Object.assign(mutable, object);

        mutable.$updateListenersOnPath = mutable.$updateListenersOnPath.bind(mutable);
        mutable.$synchronizeModel = mutable.$synchronizeModel.bind(mutable);

        mutable._globalEventEmitter.on(qualifiedEventName(mutable, '$_synchronize_model'), mutable.$synchronizeModel);
        mutable._globalEventEmitter.on(qualifiedEventName(mutable, '*'), mutable.$updateListenersOnPath);

        return mutable;
    }

    static mutateObject(object, path, value) {
        _.set(object, path, value);
        _.set(object, 'modified', Date.now());
    }
}

function qualifiedEventName(object, eventName) {
    let keystring = utils.makeKeyString(object.identifier);

    return [keystring, eventName].join(':');
}

function isChildOf(observedPath, mutatedPath) {
    return Boolean(mutatedPath === '*' || observedPath?.startsWith(mutatedPath));
}

function isParentOf(observedPath, mutatedPath) {
    return Boolean(observedPath === '*' || mutatedPath?.startsWith(observedPath));
}

export default MutableDomainObject;
