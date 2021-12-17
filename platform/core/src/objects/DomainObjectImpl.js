/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
 * Module defining DomainObject. Created by vwoeltje on 11/7/14.
 */
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
 * Module defining DomainObject. Created by vwoeltje on 11/7/14.
 */
function DomainObjectImpl(id, model, capabilities) {
    this.id = id;
    this.model = model;
    this.capabilities = capabilities;
}

DomainObjectImpl.prototype.getId = function () {
    return this.id;
};

DomainObjectImpl.prototype.getModel = function () {
    return this.model;
};

DomainObjectImpl.prototype.getCapability = function (name) {
    var capability = this.capabilities[name];

    return typeof capability === 'function'
        ? capability(this) : capability;
};

DomainObjectImpl.prototype.hasCapability = function (name) {
    return this.getCapability(name) !== undefined;
};

DomainObjectImpl.prototype.useCapability = function (name) {
    // Get tail of args to pass to invoke
    var args = Array.prototype.slice.apply(arguments, [1]),
        capability = this.getCapability(name);

    return (capability && capability.invoke)
        ? capability.invoke.apply(capability, args)
        : capability;
};

export default DomainObjectImpl;