<template>
<div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
    <button
        class="c-button--menu icon-notebook"
        title="Take a Notebook Snapshot"
        @click="setNotebookTypes"
        @click.stop="toggleMenu"
    >
        <span class="c-button__label"></span>
    </button>
    <div
        v-show="showMenu"
        class="c-menu"
    >
        <ul>
            <li
                v-for="(type, index) in notebookTypes"
                :key="index"
                :class="type.cssClass"
                :title="type.name"
                @click="snapshot(type)"
            >
                {{ type.name }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import Snapshot from '../snapshot';
import { clearDefaultNotebook, getDefaultNotebook } from '../utils/notebook-storage';
import { NOTEBOOK_DEFAULT, NOTEBOOK_SNAPSHOT } from '../notebook-constants';

export default {
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            default() {
                return {};
            }
        },
        ignoreLink: {
            type: Boolean,
            default() {
                return false;
            }
        },
        objectPath: {
            type: Array,
            default() {
                return null;
            }
        }
    },
    data() {
        return {
            notebookSnapshot: null,
            notebookTypes: [],
            showMenu: false
        }
    },
    mounted() {
        this.notebookSnapshot = new Snapshot(this.openmct);

        document.addEventListener('click', this.hideMenu);
    },
    destroyed() {
        document.removeEventListener('click', this.hideMenu);
    },
    methods: {
        async setNotebookTypes() {
            const notebookTypes = [];
            let defaultPath = '';
            const defaultNotebook = getDefaultNotebook();

            if (defaultNotebook) {
                const domainObject = await this.openmct.objects.get(defaultNotebook.notebookMeta.identifier)
                    .then(d => d);

                if (!domainObject.location) {
                    clearDefaultNotebook();
                } else {
                    defaultPath = `${domainObject.name} - ${defaultNotebook.section.name} - ${defaultNotebook.page.name}`;
                }
            }

            if (defaultPath.length !== 0) {
                notebookTypes.push({
                    cssClass: 'icon-notebook',
                    name: `Save to Notebook ${defaultPath}`,
                    type: NOTEBOOK_DEFAULT
                });
            }

            notebookTypes.push({
                cssClass: 'icon-notebook',
                name: 'Save to Notebook Snapshots',
                type: NOTEBOOK_SNAPSHOT
            });

            this.notebookTypes = notebookTypes;
        },
        toggleMenu() {
            this.showMenu = !this.showMenu;
        },
        hideMenu() {
            this.showMenu = false;
        },
        snapshot(notebook) {
            this.hideMenu();

            this.$nextTick(() => {
                const element = document.querySelector('.c-overlay__contents')
                    || document.getElementsByClassName('l-shell__main-container')[0];

                const bounds = this.openmct.time.bounds();
                const link = !this.ignoreLink
                    ? window.location.href
                    : null;

                const objectPath = this.objectPath || this.openmct.router.path;
                const snapshotMeta = {
                    bounds,
                    link,
                    objectPath,
                    openmct: this.openmct
                };

                this.notebookSnapshot.capture(snapshotMeta, notebook.type, element);
            });
        }
    }
}
</script>
