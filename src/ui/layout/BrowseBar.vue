<template>
<div class="l-browse-bar">
    <div class="l-browse-bar__start">
        <button
            v-if="hasParent"
            class="l-browse-bar__nav-to-parent-button c-icon-button c-icon-button--major icon-pointer-left"
            @click="goToParent"
        ></button>
        <div
            class="l-browse-bar__object-name--w c-object-label"
            :class="[ type.cssClass, classList ]"
        >
            <span
                class="l-browse-bar__object-name c-object-label__name c-input-inline"
                contenteditable
                @blur="updateName"
                @keydown.enter.prevent
                @keyup.enter.prevent="updateNameOnEnterKeyPress"
            >
                {{ domainObject.name }}
            </span>
        </div>
        <div
            class="l-browse-bar__context-actions c-disclosure-button"
            @click.prevent.stop="showContextMenu"
        ></div>
    </div>

    <div class="l-browse-bar__end">
        <view-switcher
            :current-view="currentView"
            :views="views"
            @setView="setView"
        />
        <!-- Action buttons -->
        <NotebookMenuSwitcher v-if="notebookEnabled"
                              :domain-object="domainObject"
                              class="c-notebook-snapshot-menubutton"
        />
        <div class="l-browse-bar__actions">
            <button
                v-if="isViewEditable & !isEditing"
                class="l-browse-bar__actions__edit c-button c-button--major icon-pencil labeled"
                title="Edit"
                @click="edit()"
            >
                <span class="c-button__label">Edit</span>
            </button>

            <div
                v-if="isEditing"
                class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
            >
                <button
                    class="c-button--menu c-button--major icon-save"
                    title="Save"
                    @click.stop="toggleSaveMenu"
                ></button>
                <div
                    v-show="showSaveMenu"
                    class="c-menu"
                >
                    <ul>
                        <li
                            class="icon-save"
                            title="Save and Finish Editing"
                            @click="saveAndFinishEditing"
                        >
                            Save and Finish Editing
                        </li>
                        <li
                            class="icon-save"
                            title="Save and Continue Editing"
                            @click="saveAndContinueEditing"
                        >
                            Save and Continue Editing
                        </li>
                    </ul>
                </div>
            </div>

            <button
                v-if="isEditing"
                class="l-browse-bar__actions c-button icon-x"
                title="Cancel Editing"
                @click="promptUserandCancelEditing()"
            ></button>
        </div>
    </div>
</div>
</template>

<script>
import ViewSwitcher from './ViewSwitcher.vue';
import NotebookMenuSwitcher from '@/plugins/notebook/components/notebook-menu-switcher.vue';

const PLACEHOLDER_OBJECT = {};

export default {
    inject: ['openmct'],
    components: {
        NotebookMenuSwitcher,
        ViewSwitcher
    },
    data: function () {
        return {
            notebookTypes: [],
            showViewMenu: false,
            showSaveMenu: false,
            domainObject: PLACEHOLDER_OBJECT,
            viewKey: undefined,
            isEditing: this.openmct.editor.isEditing(),
            notebookEnabled: this.openmct.types.get('notebook')
        }
    },
    computed: {
        classList() {
            const classList = this.domainObject.classList;
            if (!classList || !classList.length) {
                return '';
            }

            return classList.join(' ');
        },
        currentView() {
            return this.views.filter(v => v.key === this.viewKey)[0] || {};
        },
        views() {
            return this
                .openmct
                .objectViews
                .get(this.domainObject)
                .map((p) => {
                    return {
                        key: p.key,
                        cssClass: p.cssClass,
                        name: p.name
                    };
                });
        },
        hasParent() {
            return this.domainObject !== PLACEHOLDER_OBJECT &&
                    this.parentUrl !== '#/browse'
        },
        parentUrl() {
            let objectKeyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let hash = window.location.hash;
            return hash.slice(0, hash.lastIndexOf('/' + objectKeyString));
        },
        type() {
            let objectType = this.openmct.types.get(this.domainObject.type);
            if (!objectType) {
                return {}
            }
            return objectType.definition;
        },
        isViewEditable() {
            let currentViewKey = this.currentView.key;
            if (currentViewKey !== undefined) {
                let currentViewProvider = this.openmct.objectViews.getByProviderKey(currentViewKey);
                return currentViewProvider.canEdit && currentViewProvider.canEdit(this.domainObject);
            }
            return false;
        }
    },
    watch: {
        domainObject() {
            if (this.mutationObserver) {
                this.mutationObserver();
            }
            this.mutationObserver = this.openmct.objects.observe(this.domainObject, '*', (domainObject) => {
                this.domainObject = domainObject;
            });
        }
    },
    mounted: function () {
        document.addEventListener('click', this.closeViewAndSaveMenu);
        window.addEventListener('beforeunload', this.promptUserbeforeNavigatingAway);

        this.openmct.editor.on('isEditing', (isEditing) => {
            this.isEditing = isEditing;
        });
    },
    beforeDestroy: function () {
        if (this.mutationObserver) {
            this.mutationObserver();
        }
        document.removeEventListener('click', this.closeViewAndSaveMenu);
        window.removeEventListener('click', this.promptUserbeforeNavigatingAway);
    },
    methods: {
        toggleSaveMenu() {
            this.showSaveMenu = !this.showSaveMenu;
        },
        closeViewAndSaveMenu() {
            this.showViewMenu = false;
            this.showSaveMenu = false;
        },
        updateName(event) {
            if (event.target.innerText !== this.domainObject.name && event.target.innerText.match(/\S/)) {
                this.openmct.objects.mutate(this.domainObject, 'name', event.target.innerText);
            } else {
                event.target.innerText = this.domainObject.name;
            }
        },
        updateNameOnEnterKeyPress(event) {
            event.target.blur();
        },
        setView(view) {
            this.viewKey = view.key;
            this.openmct.router.updateParams({
                view: this.viewKey
            });
        },
        edit() {
            this.openmct.editor.edit();
        },
        promptUserandCancelEditing() {
            let dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: 'Any unsaved changes will be lost. Are you sure you want to continue?',
                buttons: [
                    {
                        label: 'Ok',
                        emphasis: true,
                        callback: () => {
                            this.openmct.editor.cancel().then(() => {
                                //refresh object view
                                this.openmct.layout.$refs.browseObject.show(this.domainObject, this.viewKey, true);
                            });
                            dialog.dismiss();
                        }
                    },
                    {
                        label: 'Cancel',
                        callback: () => {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        },
        promptUserbeforeNavigatingAway(event) {
            if(this.openmct.editor.isEditing()) {
                event.preventDefault();
                event.returnValue = '';
            }
        },
        saveAndFinishEditing() {
            let dialog = this.openmct.overlays.progressDialog({
                progressPerc: 'unknown',
                message: 'Do not navigate away from this page or close this browser tab while this message is displayed.',
                iconClass: 'info',
                title: 'Saving'
            });

            return this.openmct.editor.save().then(()=> {
                dialog.dismiss();
                this.openmct.notifications.info('Save successful');
            }).catch((error) => {
                dialog.dismiss();
                this.openmct.notifications.error('Error saving objects');
                console.error(error);
            });
        },
        saveAndContinueEditing() {
            this.saveAndFinishEditing().then(() => {
                this.openmct.editor.edit();
            });
        },
        showContextMenu(event) {
            this.openmct.contextMenu._showContextMenuForObjectPath(this.openmct.router.path, event.clientX, event.clientY);
        },
        goToParent() {
            window.location.hash = this.parentUrl;
        }
    }
}
</script>
