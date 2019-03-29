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
            <div class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
                 v-if="views.length > 1">
                <button class="c-button--menu"
                     :class="currentView.cssClass"
                     title="Switch view type"
                     @click.stop="toggleViewMenu">
                    <span class="c-button__label">
                          {{ currentView.name }}
                    </span>
                </button>
                <div class="c-menu" v-show="showViewMenu">
                    <ul>
                        <li v-for="(view, index) in views"
                            @click="setView(view)"
                            :key="index"
                            :class="view.cssClass"
                            :title="view.name">
                            {{ view.name }}
                        </li>
                    </ul>
                </div>
            </div>
            <!-- Action buttons -->
            <div class="l-browse-bar__actions">
                <button class="l-browse-bar__actions__notebook-entry c-button icon-notebook" 
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
const PLACEHOLDER_OBJECT = {};

    export default {
        inject: ['openmct'],
        methods: {
            toggleViewMenu() {
                this.showViewMenu = !this.showViewMenu;
            },
            toggleSaveMenu() {
                this.showSaveMenu = !this.showSaveMenu;
            },
            closeViewAndSaveMenu() {
                this.showViewMenu = false;
                this.showSaveMenu = false;
            },
            updateName(event) {
                // TODO: handle isssues with contenteditable text escaping.
                if (event.target.innerText !== this.domainObject.name) {
                    this.openmct.objects.mutate(this.domainObject, 'name', event.target.innerText);
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
                                this.openmct.editor.cancel();
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
                return this.openmct.editor.save().then(()=> {
                    this.openmct.notifications.info('Save successful');
                }).catch((error) => {
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
                isEditing: this.openmct.editor.isEditing()
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
            this.notebookSnapshot = new NotebookSnapshot(this.openmct);

            document.addEventListener('click', this.closeViewAndSaveMenu);
            window.addEventListener('beforeunload', this.promptUserbeforeNavigatingAway);

            this.openmct.editor.on('isEditing', (isEditing) => {
                this.isEditing = isEditing;
            });
        },
        beforeDestroy: function () {
            document.removeEventListener('click', this.closeViewAndSaveMenu);
            window.removeEventListener('click', this.promptUserbeforeNavigatingAway);
        }
    }
</script>

<style lang="scss">
    @import "~styles/sass-base";

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
            $p: $interiorMarginLg;
            margin-right: $interiorMargin;
            padding-left: $p;
            padding-right: $p;
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
