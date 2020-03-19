<template>
<div class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left">
    <button
        class="c-button--menu icon-notebook"
        title="Switch view type"
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
import Snapshot from '@/plugins/notebook/snapshot';
import { clearDefaultNotebook, getDefaultNotebook } from '@/plugins/notebook/utils/notebook-storage';
import { NOTEBOOK_DEFAULT, NOTEBOOK_SNAPSHOT } from '@/plugins/notebook/notebook-constants';

export default {
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            default() {
                return {};
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
        console.log('NotebookMenuSwitcher');
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
                const domainObject = await this.openmct.objects.get(defaultNotebook.notebookMeta.identifier).then(d => d);

                if (domainObject.isRemovedFromTree) {
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
            let element = document.getElementsByClassName("l-shell__main-container")[0];
            this.notebookSnapshot.capture(notebook.type, this.domainObject, element, this.openmct.time.bounds());
        }
    }
}
</script>
