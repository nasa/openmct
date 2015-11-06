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
/*global define,Promise*/

define(
    ['../objects/DomainObjectImpl', 'uuid'],
    function (DomainObjectImpl, uuid) {
        'use strict';

        /**
         * Implements the `creation` capability. This allows new domain
         * objects to be instantiated.
         *
         * @constructor
         * @memberof platform/core
         * @param $injector Angular's `$injector`
         */
        function CreationCapability($injector, domainObject) {
            this.$injector = $injector;
            this.domainObject = domainObject;
        }

        /**
         * Alias of `capabilityService.getCapabilities`; handles lazy loading
         * of `capabilityService`, since it cannot be declared as a
         * dependency directly without creating a cycle.
         * @private
         */
        CreationCapability.prototype.getCapabilities = function (model) {
            if (!this.capabilityService) {
                this.capabilityService =
                    this.$injector.get('capabilityService');
            }
            return this.capabilityService.getCapabilities(model);
        };

        /**
         * Instantiate a new domain object with the provided model.
         *
         * This domain object will have been simply instantiated; it will not
         * have been persisted, nor will it have been added to the
         * composition of the object which exposed this capability.
         *
         * @returns {DomainObject} the new domain object
         */
        CreationCapability.prototype.create = function (model) {
            var id = uuid(),
                capabilities = this.getCapabilities(model);

            // Retain any space-prefixing from the parent
            if (this.domainObject.getId().indexOf(":") !== -1) {
                id = this.domainObject.getId().split(":")[0] + ":" + id;
            }

            return new DomainObjectImpl(id, model, capabilities);
        };

        /**
         * Alias of `create`.
         * @see {platform/core.CreationCapability#create}
         */
        CreationCapability.prototype.invoke =
            CreationCapability.prototype.create;

        return CreationCapability;
    }
);
