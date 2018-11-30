<template>
    <div class="c-toolbar">
        <component v-for="item in structure"
            :is="item.control"
            :options="item"
            @click="triggerMethod(item, $event)"
            @change="updateObjectValue"></component>
    </div>
</template>

<script>
    import toolbarButton from './components/toolbar-button.vue';
    import toolbarColorPicker from './components/toolbar-color-picker.vue';
    import toolbarCheckbox from './components/toolbar-checkbox.vue';
    import toolbarInput from './components/toolbar-input.vue';
    import toolbarMenu from './components/toolbar-menu.vue';
    import toolbarSelectMenu from './components/toolbar-select-menu.vue';
    import toolbarSeparator from './components/toolbar-separator.vue';
    import toolbarToggleButton from './components/toolbar-toggle-button.vue';

    export default {
        inject: ['openmct', 'lodash'],
        components: {
            toolbarButton,
            toolbarColorPicker,
            toolbarCheckbox,
            toolbarInput,
            toolbarMenu,
            toolbarSelectMenu,
            toolbarSeparator,
            toolbarToggleButton
        },
        data: function () {
            return {
                structure: []
            };
        },
        methods: {
            handleSelection(selection) {
                this.removeListeners();
                this.domainObjectsById = {};

                if (!selection[0]) {
                    this.structure = [];
                    return;
                }

                let structure = this.openmct.toolbars.get(selection) || [];
                this.structure = structure.map(item => {
                    let toolbarItem = {...item};
                    let domainObject = toolbarItem.domainObject;
                    let formKeys = [];
                    toolbarItem.control = "toolbar-" + toolbarItem.control;

                    if (toolbarItem.dialog) {
                        toolbarItem.dialog.sections.forEach(section => {
                            section.rows.forEach(row => {
                                formKeys.push(row.key);
                            })
                        });
                        toolbarItem.formKeys = formKeys;
                    }

                    if (domainObject) {
                        if (formKeys.length > 0) {
                            toolbarItem.value = this.getFormValue(domainObject, toolbarItem);
                        } else {
                            toolbarItem.value = _.get(domainObject, item.property);
                        }

                        this.registerListener(domainObject);
                    }

                    return toolbarItem;
                });
            },
            registerListener(domainObject) {
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);

                if (!this.domainObjectsById[id]) {
                    this.domainObjectsById[id] = {
                        domainObject: domainObject
                    }
                    this.observeObject(domainObject, id);
                }
            },
            observeObject(domainObject, id) {
                let unobserveObject = this.openmct.objects.observe(domainObject, '*', function(newObject) {
                    this.domainObjectsById[id].newObject = JSON.parse(JSON.stringify(newObject));
                    this.scheduleToolbarUpdate();
                }.bind(this));
                this.unObserveObjects.push(unobserveObject);
            },
            scheduleToolbarUpdate() {
                if (this.toolbarUpdateScheduled) {
                    return;
                }

                this.toolbarUpdateScheduled = true;
                setTimeout(this.updateToolbarAfterMutation.bind(this));
            },
            updateToolbarAfterMutation() {
                this.structure = this.structure.map(item => {
                    let toolbarItem = {...item};
                    let domainObject = toolbarItem.domainObject;

                    if (domainObject) {
                        let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                        let newObject = this.domainObjectsById[id].newObject;

                        if (newObject) {
                            toolbarItem.domainObject = newObject;

                            if (toolbarItem.formKeys) {
                                toolbarItem.value = this.getFormValue(newObject, toolbarItem);
                            } else {
                                toolbarItem.value = _.get(newObject, item.property);
                            }
                        }
                    }

                    return toolbarItem;
                });

                Object.values(this.domainObjectsById).forEach(function (tracker) {
                    if (tracker.newObject) {
                        tracker.domainObject = tracker.newObject;
                        delete tracker.newObject;
                    }
                });
                this.toolbarUpdateScheduled = false;
            },
            getFormValue(domainObject, toolbarItem) {
                let value = {};
                toolbarItem.formKeys.map(key => {
                    value[key] = _.get(domainObject, toolbarItem.property + "." + key);
                });
                return value;
            },
            removeListeners() {
                if (this.unObserveObjects) {
                    this.unObserveObjects.forEach((unObserveObject) => {
                        unObserveObject();
                    });
                }
                this.unObserveObjects = [];
            },
            updateObjectValue(value, item) {
                let changedItemId = this.openmct.objects.makeKeyString(item.domainObject.identifier);
                this.structure = this.structure.map((s) => {
                    let toolbarItem = {...s};
                    let domainObject = toolbarItem.domainObject;

                    if (domainObject) {
                        let id = this.openmct.objects.makeKeyString(domainObject.identifier);

                        if (changedItemId === id && item.property === s.property) {
                            toolbarItem.value = value;
                        }
                    }

                    return toolbarItem;
                });

                // If value is an object, iterate the toolbar structure and mutate all keys in form.
                // Otherwise, mutate the property.
                if (value === Object(value)) {
                    this.structure.map(s => {
                        if (s.formKeys) {
                            s.formKeys.forEach(key => {
                                this.openmct.objects.mutate(item.domainObject, item.property + "." + key, value[key]);
                            });
                        }
                    });
                } else {
                    this.openmct.objects.mutate(item.domainObject, item.property, value);
                }
            },
            triggerMethod(item, event) {
                if (item.method) {
                    item.method({...event});
                }
            },
            handleEditing(isEditing) {
                this.handleSelection(this.openmct.selection.get());
            }
        },
        mounted() {
            this.openmct.selection.on('change', this.handleSelection);
            this.handleSelection(this.openmct.selection.get());

            // Toolbars may change when edit mode is enabled/disabled, so listen
            // for edit mode changes and update toolbars if necessary.
            this.openmct.editor.on('isEditing', this.handleEditing);
        },
        detroyed() {
            this.openmct.selection.off('change', this.handleSelection);
            this.openmct.editor.off('isEditing', this.handleEditing);
            this.removeListeners();
        }
    }
</script>
