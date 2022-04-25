import CopyToNotebookAction from './actions/CopyToNotebookAction';
import NotebookSnapshotIndicator from './components/NotebookSnapshotIndicator.vue';
import NotebookViewProvider from './NotebookViewProvider';
import SnapshotContainer from './snapshot-container';
import monkeyPatchObjectAPIForNotebooks from './monkeyPatchObjectAPIForNotebooks.js';

import { notebookImageMigration, IMAGE_MIGRATION_VER } from '../notebook/utils/notebook-migration';
import {
    NOTEBOOK_TYPE,
    RESTRICTED_NOTEBOOK_TYPE,
    NOTEBOOK_VIEW_TYPE,
    RESTRICTED_NOTEBOOK_VIEW_TYPE,
    NOTEBOOK_INSTALLED_KEY,
    RESTRICTED_NOTEBOOK_INSTALLED_KEY
} from './notebook-constants';

import Vue from 'vue';

export default function NotebookPlugin(config = {}) {
    return function install(openmct) {
        console.log('plugin config', config);
        let isRestricted = config.type === 'restricted';
        let pluginInstalledKey = isRestricted ? RESTRICTED_NOTEBOOK_INSTALLED_KEY : NOTEBOOK_INSTALLED_KEY;
        let firstOfAnyNotebookPluginInstall = !openmct[NOTEBOOK_INSTALLED_KEY] && !openmct[RESTRICTED_NOTEBOOK_INSTALLED_KEY];

        if (openmct[pluginInstalledKey]) {
            return;
        } else {
            openmct[pluginInstalledKey] = true;
        }

        let notebookName = config.name || 'Notebook';
        let type = NOTEBOOK_TYPE;
        let notebookViewType = NOTEBOOK_VIEW_TYPE;
        let notebookIcon = 'icon-notebook';
        let notebookDescription = 'Create and save timestamped notes with embedded object snapshots.';

        if (isRestricted) {
            notebookName = config.name || 'Restricted Notebook';
            type = RESTRICTED_NOTEBOOK_TYPE;
            notebookViewType = RESTRICTED_NOTEBOOK_VIEW_TYPE;
            notebookIcon = 'icon-lock'; // need to update to new icon
            notebookDescription = 'Create and save timestamped notes with embedded object snapshots and the ability to restrict certain functionality.';
        } else {
            // restricted notebooks are newer and should not have any legacy versions at this point
            openmct.objects.addGetInterceptor({
                appliesTo: (identifier, domainObject) => {
                    return domainObject && domainObject.type === NOTEBOOK_TYPE;
                },
                invoke: (identifier, domainObject) => {
                    notebookImageMigration(openmct, domainObject);

                    return domainObject;
                }
            });
        }

        const notebookType = {
            name: notebookName,
            description: notebookDescription,
            creatable: true,
            cssClass: notebookIcon,
            initialize: domainObject => {
                domainObject.configuration = {
                    defaultSort: 'oldest',
                    entries: {},
                    imageMigrationVer: IMAGE_MIGRATION_VER,
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
                    required: true,
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
                    required: true,
                    property: [
                        "configuration",
                        "pageTitle"
                    ]
                }
            ]
        };
        openmct.types.addType(type, notebookType);

        const snapshotContainer = new SnapshotContainer(openmct);

        openmct.objectViews.addProvider(new NotebookViewProvider(
            openmct,
            notebookViewType,
            notebookName,
            notebookIcon,
            config,
            snapshotContainer
        ));

        // only do these things once
        if (firstOfAnyNotebookPluginInstall) {
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

            openmct.actions.register(new CopyToNotebookAction(openmct));

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
                key: 'notebook-snapshot-indicator',
                priority: openmct.priority.DEFAULT
            };

            openmct.indicators.add(indicator);

            monkeyPatchObjectAPIForNotebooks(openmct);
        }
    };
}
