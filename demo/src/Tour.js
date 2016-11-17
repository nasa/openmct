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
        "use strict";

        return {
            id: "hello-hopscotch",
            steps: [
                {
                    title: "Welcome to Open MCT",
                    content: "This brief tour will introduce you" +
                    " to the main elements and concepts of the application. To cancel at any time, click the 'x' in the top right of this box, or click 'Next' to continue.",
                    target: ".user-environ",
                    placement: "top",
                    xOffset: "center",
                    yOffset: "center",
                    arrowOffset: "100000px"
                },
                {
                    title: "Object Tree",
                    content: "This contains all the objects you have access to, both telemetry objects and user-created objects. ",
                    target: "mct-tree ul.tree",
                    placement: "right"
                },
                {
                    title: "View Area",
                    content: "This area shows the contents of a selected item. Different types of items provide different views of their contents.",
                    target: ".object-holder-main",
                    placement: "top",
                    xOffset: "center",
                    yOffset: "200px",
                    arrowOffset: "center"
                },
                {
                    title: "Create Button",
                    content: "Many objects in the application are created via this button. <b>Click it now</b> to view the Create menu, and rollover each item in the menu to see more information about it. Or, click 'Next' to continue.",
                    target: ".create-btn",
                    placement: "right",
                    yOffset: "-10px",
                    nextOnTargetClick: true
                },
                {
                    title: "Inspection Pane",
                    content: "This pane shows useful information about the currently selected item.",
                    target: ".split-pane-component.t-inspect",
                    placement: "left"
                },
                {
                    title: "Search",
                    content: "Search filters items in the Object Tree by their name. You can also filter by object type by clicking the 'down' arrow in the right side of the input.",
                    target: ".search-bar",
                    placement: "right",
                    yOffset: "-20px"
                },
                {
                    title: "Editing",
                    content: "This part of the tour will step you through editing an object. Click 'Next' to continue.",
                    target: ".user-environ",
                    placement: "top",
                    xOffset: "center",
                    yOffset: "center",
                    arrowOffset: "100000px"
                },
                {
                    title: "Select Object to Edit",
                    content: "Expand the 'My Items' folder and click on the 'Edit Display Layout Example' object to select it. Click 'Next' when you're ready to continue.",
                    target: "mct-tree ul.tree",
                    placement: "right",
                    yOffset: "20px"
                },
                {
                    title: "Edit Button",
                    content: "<b>Click this button now</b> to begin editing the current object.",
                    target: ".object-browse-bar .btn-bar",
                    placement: "bottom",
                    arrowOffset: "170px",
                    width: "200px",
                    xOffset: "-180px",
                    nextOnTargetClick: true
                },
                {
                    title: "Editing",
                    content: "Each type of object can be edited in different ways. This Display Layout allows you to add, position, size and remove many different types of objects. ",
                    target: ".user-environ",
                    placement: "top",
                    xOffset: "center",
                    yOffset: "center",
                    arrowOffset: "100000px",
                    nextOnTargetClick: true
                },
                {
                    title: "Adding an Object",
                    content: "Let’s add a telemetry element into our layout. Expand 'Real-time Telemetry', then 'Rover Subsystems', then 'Thermal'. Drag 'Wheel RL Temp' into the empty space in the example layout, then click 'Next' to continue.",
                    target: "mct-tree ul.tree",
                    yOffset: "50px",
                    placement: "right"
                },
                {
                    title: "Positioning and Resizing",
                    content: "Any object in a layout can be positioned and resized. Mouse over the object, and grab a corner and drag it to make it fit in the empty spot. When you’re done, click 'Next' to continue.",
                    target: ".user-environ",
                    placement: "left",
                    xOffset: "center",
                    yOffset: "200px"
                },
                {
                    title: "Elements Pool",
                    content: "When the Object Inspector is expanded, this " +
                    "area lists all objects in the current object. " +
                    "To remove an object, right-click it and choose 'Remove' " +
                    "from the context menu.",
                    target: ".holder-elements",
                    placement: "left"
                },
                {
                    title: "Saving",
                    content: "When you are done editing, click 'Save' to save and exit editing. To exit without saving any changes, click the 'X' button.",
                    target: ".t-save",
                    width: "200px",
                    placement: "bottom",
                    nextOnTargetClick: true
                },
                {
                    title: "Object Types",
                    content: "Try experimenting by creating" +
                    " different object types, and adding objects to them by dragging them from the tree. Only certain types of objects can be dragged into a given object type - if a type of object can’t be added, it simply won’t. ",
                    target: ".user-environ",
                    placement: "top",
                    xOffset: "center",
                    yOffset: "center",
                    arrowOffset: "100000px"
                },
                {
                    title: "Thank You",
                    content: "<p>That’s the end of the tour." +
                    " Thanks" +
                    " for your time, and we hope you enjoy using" +
                    " and contributing to Open MCT!</p> " +
                    " <p>To find out more about Open MCT," +
                    " please visit our website -<p>" +
                    "<a target=\"_blank\"" +
                    " href=\"https://nasa.github.io/openmct/\">" +
                    "<strong>https://nasa.github.io/openmct</strong></a>",
                    target: ".user-environ",
                    placement: "top",
                    xOffset: "center",
                    yOffset: "center",
                    arrowOffset: "100000px"
                }
            ]
        };
    }
);
