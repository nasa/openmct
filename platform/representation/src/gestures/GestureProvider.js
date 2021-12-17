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
 * Module defining GestureProvider. Created by vwoeltje on 11/22/14.
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
 * Module defining GestureProvider. Created by vwoeltje on 11/22/14.
 */
function GestureProvider(gestures) {
    var gestureMap = {};

    // Assemble all gestures into a map, for easy look up
    gestures.forEach(function (gesture) {
        gestureMap[gesture.key] = gestureMap[gesture.key] || gesture;
    });

    this.gestureMap = gestureMap;
}

function releaseGesture(gesture) {
    // Invoke the gesture's "destroy" method (if there is one)
    // to release any held resources and detach event handlers.
    if (gesture && gesture.destroy) {
        gesture.destroy();
    }
}

GestureProvider.prototype.attachGestures = function attachGestures(element, domainObject, gestureKeys) {
    // Look up the desired gestures, filter for applicability,
    // and instantiate them. Maintain a reference to allow them
    // to be destroyed as a group later.
    var gestureMap = this.gestureMap,
        attachedGestures = gestureKeys.map(function (key) {
            return gestureMap[key];
        }).filter(function (Gesture) {
            return Gesture !== undefined && (Gesture.appliesTo
                ? Gesture.appliesTo(domainObject)
                : true);
        }).map(function (Gesture) {
            return new Gesture(element, domainObject);
        });

    return {
        destroy: function () {
            // Just call all the individual "destroy" methods
            attachedGestures.forEach(releaseGesture);
        }
    };
};

export default GestureProvider;