/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

/**
 * @type {EventHelpers}
 */
const helperFunctions = {
  listenTo: function (object, event, callback, context) {
    if (!this._listeningTo) {
      this._listeningTo = [];
    }

    const listener = {
      object: object,
      event: event,
      callback: callback,
      context: context,
      _cb: context ? callback.bind(context) : callback
    };
    if (object.$watch && event.indexOf('change:') === 0) {
      const scopePath = event.replace('change:', '');
      listener.unlisten = object.$watch(scopePath, listener._cb, true);
    } else if (object.$on) {
      listener.unlisten = object.$on(event, listener._cb);
    } else if (object.addEventListener) {
      object.addEventListener(event, listener._cb);
    } else {
      object.on(event, listener._cb, listener.context);
    }

    this._listeningTo.push(listener);
  },

  stopListening: function (object, event, callback, context) {
    if (!this._listeningTo) {
      this._listeningTo = [];
    }

    this._listeningTo
      .filter(function (listener) {
        if (object && object !== listener.object) {
          return false;
        }

        if (event && event !== listener.event) {
          return false;
        }

        if (callback && callback !== listener.callback) {
          return false;
        }

        if (context && context !== listener.context) {
          return false;
        }

        return true;
      })
      .map(function (listener) {
        if (listener.unlisten) {
          listener.unlisten();
        } else if (listener.object.removeEventListener) {
          listener.object.removeEventListener(listener.event, listener._cb);
        } else {
          listener.object.off(listener.event, listener._cb, listener.context);
        }

        return listener;
      })
      .forEach(function (listener) {
        this._listeningTo.splice(this._listeningTo.indexOf(listener), 1);
      }, this);
  },

  extend: function (object) {
    object.listenTo = helperFunctions.listenTo;
    object.stopListening = helperFunctions.stopListening;
  }
};

export default helperFunctions;
/**
 * @typedef {Object} EventHelpers
 * @property {(object: any, event: string, callback: Function, context?: any) => void} listenTo
 * @property {(object: any, event?: string, callback?: Function, context?: any) => void} stopListening
 */
