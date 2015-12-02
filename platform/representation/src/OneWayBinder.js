/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    [],
    function () {
        'use strict';

        /**
         * Supports the "one-way" binding behavior of `mct-representation`
         * and `mct-include`; watches expression associated with attributes
         * in a parent scope, then passes these into the child scope when
         * they change (but does not assign anything back to the parent
         * scope if the child changes.)
         * @constructor
         * @memberof platform/representation
         * @param scope the Angular scope to watch
         * @param attrs the relevant attributes, as passed into the `link`
         *              function of the relevant directive
         */
        function OneWayBinder(scope, attrs) {
            var self = this;

            this.unwatches = [];
            this.scope = scope;
            this.parent = scope.$parent;
            this.attrs = attrs;

            // Detach any listeners from the parent
            scope.$on('$destroy', function () {
                self.unwatches.forEach(function (unwatch) {
                    unwatch();
                });
            });
        }

        /**
         * One-way bind an attribute. The value of the named attribute will
         * be watched as an Angular expression in the parent scope; its
         * value will be exposed in the child scope as a property of
         * the same name.
         * @param {string} attr the name of the attribute to watch
         * @param {Function} [callback] a callback to invoke with new values
         */
        OneWayBinder.prototype.bind = function (attr, callback) {
            this.alias(attr, attr, callback);
        };

        /**
         * One-way bind an attribute. As `bind`, but allows the property
         * name in the child scope used to expose these values to be
         * specified as something different from the attribute name.
         * @param {string} attr the name of the attribute to watch
         * @param {string} property the name of the property to use in scope
         * @param {Function} [callback] a callback to invoke with new values
         */
        OneWayBinder.prototype.alias = function (attr, property, callback) {
            var scope = this.scope;

            this.watch(attr, function expose(value) {
                scope[property] = value;
                if (callback) {
                    callback(value);
                }
            });

            // Expose in scope immediately, similar to scope: { attr: "=" }
            // in a directive definition object.
            scope[property] = this.parent.$eval(this.attrs[attr]);
        };

        /**
         * Watch for changes in this attribute. The named attribute's value
         * will be watched as an Angular expression in the parent scope,
         * and the provided callback will be invoked with the value of that
         * expression when changes occur.
         * @param {string} attr the name of the attribute to watch
         * @param {Function} callback the callback to invoke with new values
         */
        OneWayBinder.prototype.watch = function (attr, callback) {
            var expr = this.attrs[attr];
            this.unwatches.push(this.parent.$watch(
                expr,
                callback,
                expr && expr[0] === '{'
            ));
        };

        return OneWayBinder;
    }
);
