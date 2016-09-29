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
    'EventEmitter',
    './MCT',
    './api/Type',
    './Registry',
    './selection/Selection',
    './selection/ContextManager',
    './selection/SelectGesture',
    './ui/menu/ContextMenuGesture',
    './ui/OverlayManager',
    './ui/ViewRegistry'
], function (
    EventEmitter,
    MCT,
    Type,
    Registry,
    Selection,
    ContextManager,
    SelectGesture,
    ContextMenuGesture,
    OverlayManager,
    ViewRegistry
) {

    /**
     * Open MCT is an extensible web application for building mission
     * control user interfaces. This module is itself an instance of
     * [MCT]{@link module:openmct.MCT}, which provides an interface for
     * configuring and executing the application.
     *
     * @exports openmct
     */
    var openmct = new MCT();
    var overlayManager = new OverlayManager(window.document.body);
    var actionRegistry = new Registry();
    var selection = new Selection();
    var manager = new ContextManager();
    var select = new SelectGesture(manager, selection);
    var contextMenu = new ContextMenuGesture(
            selection,
            overlayManager,
            actionRegistry,
            manager
        );

    EventEmitter.call(openmct);

    openmct.MCT = MCT;
    openmct.Type = Type;

    openmct.selection = selection;
    openmct.inspectors = new ViewRegistry();

    openmct.gestures = {
        selectable: select.apply.bind(select),
        contextual: contextMenu.apply.bind(contextMenu)
    };

    return openmct;
});
