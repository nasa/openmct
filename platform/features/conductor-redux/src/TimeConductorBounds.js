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

define( [], function () {

    function TimeConductorBounds(conductor) {
        this.listeners = [];
        this.start = new TimeConductorLimit(this);
        this.end = new TimeConductorLimit(this);
        this.conductor = conductor;
    }

    /**
     * @private
     */
    TimeConductorBounds.prototype.notify = function (eventType) {
        eventType = eventType || this.conductor.EventTypes.EITHER;

        this.listeners.forEach(function (element){
            if (element.eventType & eventType){
                element.listener(this);
            }
        });
    };



    /**
     * Listen for changes to the bounds
     * @param listener a callback function to be called when the bounds change. The bounds object will be passed into
     * the function (ie. 'this')
     * @param eventType{TimeConductorBounds.EventType} The event type to listen to, ie. system, user, or Both. If not provied, will default to both.
     * @returns {Function} an 'unlisten' function
     */
    TimeConductorBounds.prototype.listen = function (listener, eventType) {
        var self = this,
            wrappedListener = {
            listener: listener,
            eventType: eventType
        };
        this.listeners.push(wrappedListener);
        return function () {
            self.listeners = self.listeners.filter(function (element){
                return element !== wrappedListener;
            });
        };
    };

    return TimeConductorBounds;
});
