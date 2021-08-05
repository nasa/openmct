import CopyToNotebookAction from './actions/CopyToNotebookAction';
import Notebook from './components/Notebook.vue';
import NotebookSnapshotIndicator from './components/NotebookSnapshotIndicator.vue';
import SnapshotContainer from './snapshot-container';

import { notebookImageMigration } from '../notebook/utils/notebook-migration';
import { NOTEBOOK_TYPE } from './notebook-constants';

import Vue from 'vue';

export default function NotebookPlugin() {
    return function install(openmct) {
        if (openmct._NOTEBOOK_PLUGIN_INSTALLED) {
            return;
        } else {
            openmct._NOTEBOOK_PLUGIN_INSTALLED = true;
        }

        openmct.actions.register(new CopyToNotebookAction(openmct));

        const notebookType = {
            name: 'Notebook',
            description: 'Create and save timestamped notes with embedded object snapshots.',
            creatable: true,
            cssClass: 'icon-notebook',
            initialize: domainObject => {
                domainObject.configuration = {
                    defaultSort: 'oldest',
                    entries: {},
                    pageTitle: 'Page',
                    sections: [],
                    sectionTitle: 'Section',
                    type: 'General'
                };
            },
            form: [
                {
                    key: 'defaultSort',
                    name: 'Entry Sorting',
                    control: 'select',
                    options: [
                        {
                            name: 'Newest First',
                            value: "newest"
                        },
                        {
                            name: 'Oldest First',
                            value: "oldest"
                        }
                    ],
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "defaultSort"
                    ]
                },
                {
                    key: 'type',
                    name: 'Note book Type',
                    control: 'textfield',
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "type"
                    ]
                },
                {
                    key: 'sectionTitle',
                    name: 'Section Title',
                    control: 'textfield',
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "sectionTitle"
                    ]
                },
                {
                    key: 'pageTitle',
                    name: 'Page Title',
                    control: 'textfield',
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "pageTitle"
                    ]
                }
            ]
        };
        openmct.types.addType(NOTEBOOK_TYPE, notebookType);

        const notebookSnapshotImageType = {
            name: 'Notebook Snapshot Image Storage',
            description: 'Notebook Snapshot Image Storage object',
            creatable: false,
            initialize: domainObject => {
                domainObject.configuration = {
                    fullSizeImageURL: undefined,
                    thumbnailImageURL: undefined
                };
            }
        };
        openmct.types.addType('notebookSnapshotImage', notebookSnapshotImageType);

        const snapshotContainer = new SnapshotContainer(openmct);
        const notebookSnapshotIndicator = new Vue ({
            components: {
                NotebookSnapshotIndicator
            },
            provide: {
                openmct,
                snapshotContainer
            },
            template: '<NotebookSnapshotIndicator></NotebookSnapshotIndicator>'
        });
        const indicator = {
            element: notebookSnapshotIndicator.$mount().$el,
            key: 'notebook-snapshot-indicator'
        };

        openmct.indicators.add(indicator);

        openmct.objectViews.addProvider({
            key: 'notebook-vue',
            name: 'Notebook View',
            cssClass: 'icon-notebook',
            canView: function (domainObject) {
                return domainObject.type === 'notebook';
            },
            view: function (domainObject) {
                let component;

                return {
                    show(container) {
                        component = new Vue({
                            el: container,
                            components: {
                                Notebook
                            },
                            provide: {
                                openmct,
                                snapshotContainer
                            },
                            data() {
                                return {
                                    domainObject
                                };
                            },
                            template: '<Notebook :domain-object="domainObject"></Notebook>'
                        });
                    },
                    destroy() {
                        component.$destroy();
                    }
                };
            }
        });

        openmct.objects.addGetInterceptor({
            appliesTo: (identifier, domainObject) => {
                return domainObject && domainObject.type === 'notebook';
            },
            invoke: (identifier, domainObject) => {
                notebookImageMigration(openmct, domainObject);

                return domainObject;
            }
        });
    };
}
