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
    'zepto',
    './TreeNodeView',
    'text!../../res/templates/tree/wait-node.html'
], ($, TreeNodeView, spinnerTemplate) => {

    class TreeView {
      constructor(gestureService, selectFn) {
        this.ul = $('<ul class="tree"></ul>');
        this.nodeViews = [];
        this.callbacks = [];
        this.selectFn = selectFn || this.value.bind(this);
        this.gestureService = gestureService;
        this.pending = false;
    }

    newTreeView() {
        return new TreeView(this.gestureService, this.selectFn);
    };

    setSize(sz) {
        let nodeView;

        while (this.nodeViews.length < sz) {
            nodeView = new TreeNodeView(
                this.gestureService,
                this.newTreeView.bind(this),
                this.selectFn
            );
            this.nodeViews.push(nodeView);
            this.ul.append($(nodeView.elements()));
        }

        while (this.nodeViews.length > sz) {
            nodeView = this.nodeViews.pop();
            $(nodeView.elements()).remove();
        }
    };

    loadComposition() {
        var domainObject = this.activeObject;

        const addNode = (domainObj, index) => {
            this.nodeViews[index].model(domainObj);
        }

        const addNodes = (domainObjects) => {
            if (this.pending) {
                this.pending = false;
                this.nodeViews = [];
                this.ul.empty();
            }

            if (domainObject === this.activeObject) {
                this.setSize(domainObjects.length);
                domainObjects.forEach(addNode);
                this.updateNodeViewSelection();
            }
        }

        domainObject.useCapability('composition')
            .then(addNodes);
    };

    model(domainObject) {
        if (this.unlisten) {
            this.unlisten();
        }

        this.activeObject = domainObject;
        this.ul.empty();

        if (domainObject && domainObject.hasCapability('composition')) {
            this.pending = true;
            this.ul.append($(spinnerTemplate));
            this.unlisten = domainObject.getCapability('mutation')
                .listen(this.loadComposition.bind(this));
            this.loadComposition(domainObject);
        } else {
            this.setSize(0);
        }
    };

    updateNodeViewSelection() {
        this.nodeViews.forEach( (nodeView) => {
            nodeView.value(this.selectedObject);
        });
    };

    value(domainObject, event) {
        this.selectedObject = domainObject;
        this.updateNodeViewSelection();
        this.callbacks.forEach( (callback) => {
            callback(domainObject, event);
        });
    };

    observe(callback) {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter( (c) => {
                return c !== callback;
            });
        }
    };

    /**
     *
     * @returns {HTMLElement[]}
     */
    elements() {
        return this.ul;
    };
  }
    return TreeView;
});
