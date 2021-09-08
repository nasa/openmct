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

import TableView from '../telemetryTable/components/table.vue';
import LADTable from './LADTable.js';
import Vue from 'vue';
export default class LADTableView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.objectPath = objectPath;
        this.component = undefined;
        this.table = new LADTable(domainObject, openmct);
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                TableView
            },
            provide: {
                openmct: this.openmct,
                currentView: this,
                table: this.table,
                objectPath: this.objectPath
            },
            data: () => {
                return {
                    domainObject: this.domainObject,
                    marking: {
                        disableMultiSelect: false,
                        enable: true,
                        rowName: '',
                        rowNamePlural: '',
                        useAlternateControlBar: false
                    }
                };
            },
            template: '<table-view ref="tableView" :marking="marking" :domain-object="domainObject"></table-view>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.tableView.getViewContext();
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }
}
