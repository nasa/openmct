<template>
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <button class="l-browse-bar__nav-to-parent-button c-click-icon icon-pointer-left"></button>
            <div class="l-browse-bar__object-name--w"
                 :class="type.cssClass">
                <span
                    class="l-browse-bar__object-name c-input-inline"
                    v-on:blur="updateName"
                    contenteditable>
                    {{ domainObject.name }}
                </span>
            </div>
            <div class="l-browse-bar__context-actions c-disclosure-button"></div>
        </div>

        <div class="l-browse-bar__end">
            <div class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
                 v-if="views.length > 1">
                <button class="c-button--menu"
                     :class="currentView.cssClass"
                     title="Switch view type"
                     @click="toggleViewMenu">
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
                <button class="l-browse-bar__actions__edit c-button icon-notebook" title="New Notebook entry"></button>
                <button class="l-browse-bar__actions__notebook-entry c-button c-button--major icon-pencil" title="Edit" v-if="!isEditing" @click="edit()"></button>
                <button class="l-browse-bar__actions c-button c-button--major icon-save" title="Save and Finish Editing" v-if="isEditing" @click="saveAndFinishEditing()"></button>
                <button class="l-browse-bar__actions c-button icon-x" title="Cancel Editing" v-if="isEditing" @click="cancelEditing()"></button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        inject: ['openmct'],
        methods: {
            toggleViewMenu: function (event) {
                event.stopPropagation();
                this.showViewMenu = !this.showViewMenu;
            },
            updateName: function (event) {
                // TODO: handle isssues with contenteditable text escaping.
                if (event.target.innerText !== this.domainObject.name) {
                    this.openmct.objects.mutate(this.domainObject, 'name', event.target.innerText);
                }
            },
            setView: function (view) {
                this.viewKey = view.key;
                this.openmct.router.updateParams({
                    view: this.viewKey
                });
            },
            edit() {
                this.openmct.editor.edit();
            },
            cancelEditing() {
                this.openmct.editor.cancel();
            },
            saveAndFinishEditing() {
                this.openmct.editor.save().then(()=> {
                    this.openmct.notifications.info('Save successful');
                }).catch((error) => {
                    this.openmct.notifications.error('Error saving objects');
                    console.error(error);
                });
            }
        },
        data: function () {
            return {
                showViewMenu: false,
                domainObject: {},
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
            type() {
                let objectType = this.openmct.types.get(this.domainObject.type);
                if (!objectType) {
                    return {}
                }
                return objectType.definition;
            }
        },
        mounted: function () {
            document.addEventListener('click', () => {
                if (this.showViewMenu) {
                    this.showViewMenu = false;
                }
            });

            this.openmct.editor.on('isEditing', (isEditing) => {
                this.isEditing = isEditing;
            });
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
            font-size: 1.4em;
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
