<template>
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <button v-if="hasParent"
                class="l-browse-bar__nav-to-parent-button c-icon-button c-icon-button--major icon-pointer-left"
                @click="goToParent"></button>
            <div class="l-browse-bar__object-name--w"
                 :class="type.cssClass">
                <span
                    class="l-browse-bar__object-name c-input-inline"
                    @blur="updateName"
                    @keydown.enter.prevent
                    @keyup.enter.prevent="updateNameOnEnterKeyPress"
                    contenteditable>
                    {{ domainObject.name }}
                </span>
            </div>
            <div class="l-browse-bar__context-actions c-disclosure-button" @click.prevent.stop="showContextMenu"></div>
        </div>

        <div class="l-browse-bar__end">
            <view-switcher
                :currentView="currentView"
                :views="views"
                @setView="setView">
            </view-switcher>
            <!-- Action buttons -->
            <div class="l-browse-bar__actions">
                <button v-if="notebookEnabled" 
                    class="l-browse-bar__actions__notebook-entry c-button icon-notebook" 
                    title="New Notebook entry" 
                    @click="snapshot()">
                </button>
                <button class="l-browse-bar__actions__edit c-button c-button--major icon-pencil" title="Edit" v-if="isViewEditable & !isEditing" @click="edit()"></button>

                <div class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
                    v-if="isEditing">
                    <button class="c-button--menu c-button--major icon-save" title="Save" @click.stop="toggleSaveMenu"></button>
                    <div class="c-menu" v-show="showSaveMenu">
                        <ul>
                            <li @click="saveAndFinishEditing"
                                class="icon-save"
                                title="Save and Finish Editing">
                                Save and Finish Editing
                            </li>
                            <li @click="saveAndContinueEditing"
                                class="icon-save"
                                title="Save and Continue Editing">
                                Save and Continue Editing
                            </li>
                        </ul>
                    </div>
                </div>
                
                <button class="l-browse-bar__actions c-button icon-x" title="Cancel Editing" v-if="isEditing" @click="promptUserandCancelEditing()"></button>
            </div>
        </div>
    </div>
</template>

<script>
import NotebookSnapshot from '../utils/notebook-snapshot';
import ViewSwitcher from './ViewSwitcher.vue';
const PLACEHOLDER_OBJECT = {};

    export default {
        inject: ['openmct'],
        components: {
            ViewSwitcher
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
            updateNameOnEnterKeyPress (event) {
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
                    title: 'Saving',
                });

                return this.openmct.editor.save()
                    .then(()=> {
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
            snapshot() {
                let element = document.getElementsByClassName("l-shell__main-container")[0];
                this.notebookSnapshot.capture(this.domainObject, element);
            },
            goToParent(){
                window.location.hash = this.parentUrl;
            }
        },
        data: function () {
            return {
                showViewMenu: false,
                showSaveMenu: false,
                domainObject: PLACEHOLDER_OBJECT,
                viewKey: undefined,
                isEditing: this.openmct.editor.isEditing(),
                notebookEnabled: false
            }
        },
        computed: {
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
        mounted: function () {

            if (this.openmct.types.get('notebook')) {
                this.notebookSnapshot = new NotebookSnapshot(this.openmct);
                this.notebookEnabled = true;
            }

            document.addEventListener('click', this.closeViewAndSaveMenu);
            window.addEventListener('beforeunload', this.promptUserbeforeNavigatingAway);

            this.openmct.editor.on('isEditing', (isEditing) => {
                this.isEditing = isEditing;
            });
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
        beforeDestroy: function () {
            if (this.mutationObserver) {
                this.mutationObserver();
            }
            document.removeEventListener('click', this.closeViewAndSaveMenu);
            window.removeEventListener('click', this.promptUserbeforeNavigatingAway);
        }
    }
</script>

<style lang="scss">
    .l-browse-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;

        [class*="__"] {
            // Removes extraneous horizontal white space
            display: inline-flex;
        }

        &__start {
            display: flex;
            align-items: center;
            flex: 1 1 auto;
            margin-right: $interiorMargin;
            min-width: 0; // Forces interior to compress when pushed on
        }

        &__end {
            display: flex;
            align-items: center;
            flex: 0 0 auto;

            [class*="__"] + [class*="__"] {
                margin-left: $interiorMarginSm;
            }
        }

        &__nav-to-parent-button,
        &__disclosure-button {
            flex: 0 0 auto;
        }

        &__nav-to-parent-button {
            // This is an icon-button
            $p: $interiorMargin;
            margin-right: $interiorMargin;
            padding-left: $p;
            padding-right: $p;

            .is-editing & {
                display: none;
            }
        }

        &__object-name--w {
            align-items: center;
            display: flex;
            flex: 0 1 auto;
            @include headerFont(1.4em);
            min-width: 0;

            &:before {
                // Icon
                opacity: 0.5;
                margin-right: $interiorMargin;
            }
        }

        &__object-name {
            flex: 0 1 auto;
        }
    }
</style>
