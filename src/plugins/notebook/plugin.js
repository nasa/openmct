// import NotebookController from './notebook-controller';
import Notebook from './components/notebook.vue';
import Vue from 'vue';

let installed  = false;

export default function NotebookPlugin() {
    return function install(openmct) {
        if (installed) {
            return;
        }

        installed = true;

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
        openmct.types.addType('notebook', notebookType);

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
                                domainObject
                            },
                            template: '<Notebook></Notebook>'
                        });
                    },
                    destroy() {
                        component.$destroy();
                    }
                };
            }
        });
    };
}
