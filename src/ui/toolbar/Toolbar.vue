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

    import _ from 'lodash';

    export default {
        inject: ['openmct'],
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

                if (selection.length === 0 || !selection[0][0]) {
                    this.structure = [];
                    return;
                }

                let structure = this.openmct.toolbars.get(selection) || [];
                this.structure = structure.map(toolbarItem => {
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
                        toolbarItem.value = this.getValue(domainObject, toolbarItem);
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
                    this.updateToolbarAfterMutation();
                }.bind(this));
                this.unObserveObjects.push(unobserveObject);
            },
            updateToolbarAfterMutation() {
                this.structure = this.structure.map(toolbarItem => {
                    let domainObject = toolbarItem.domainObject;

                    if (domainObject) {
                        let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                        let newObject = this.domainObjectsById[id].newObject;

                        if (newObject) {
                            toolbarItem.domainObject = newObject;
                            toolbarItem.value = this.getValue(newObject, toolbarItem);
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
            },
            getValue(domainObject, toolbarItem) {
                let value = undefined;
                let applicableSelectedItems = toolbarItem.applicableSelectedItems;

                if (!applicableSelectedItems) {
                    return value;
                }

                if (toolbarItem.formKeys) {
                    value = this.getFormValue(domainObject, toolbarItem);
                } else {
                    let values = [];
                    applicableSelectedItems.forEach(selectionPath => {
                        values.push(_.get(domainObject, this.getItemProperty(toolbarItem, selectionPath)));
                    });

                    // If all values are the same, use it, otherwise mark the item as non-specific.
                    if (values.every(value => value === values[0])) {
                        value = values[0];
                        toolbarItem.nonSpecific = false;
                    } else {
                        toolbarItem.nonSpecific = true;
                    }
                }

                return value;
            },
            getFormValue(domainObject, toolbarItem) {
                let value = {};
                let values = {};
                toolbarItem.formKeys.map(key => {
                    values[key] = [];
                    toolbarItem.applicableSelectedItems.forEach(selectionPath => {
                        values[key].push(_.get(domainObject, this.getItemProperty(toolbarItem, selectionPath) + "." + key));
                    });
                });

                for (const key in values) {
                    if (values[key].every(value => value === values[key][0])) {
                        value[key] = values[key][0];
                        toolbarItem.nonSpecific = false;
                    } else {
                        toolbarItem.nonSpecific = true;
                        return {};
                    }
                }

                return value;
            },
            getItemProperty(item, selectionPath) {
                return (typeof item.property === "function") ? item.property(selectionPath) : item.property;
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

                this.structure = this.structure.map(toolbarItem => {
                    if (toolbarItem.domainObject) {
                        let id = this.openmct.objects.makeKeyString(toolbarItem.domainObject.identifier);

                        if (changedItemId === id && _.isEqual(toolbarItem, item)) {
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
                                item.applicableSelectedItems.forEach(selectionPath => {
                                    this.openmct.objects.mutate(item.domainObject,
                                        this.getItemProperty(item, selectionPath) + "." + key, value[key]);
                                });
                            });
                        }
                    });
                } else {
                    item.applicableSelectedItems.forEach(selectionPath => {
                        this.openmct.objects.mutate(item.domainObject, this.getItemProperty(item, selectionPath), value);    
                    });
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
