<template>
    <div class="c-toolbar" v-if="structure.length !== 0">
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
                this.structure = structure.map(function (item) {
                    let toolbarItem = {...item};
                    toolbarItem.control = "toolbar-" + toolbarItem.control;
                    toolbarItem.value = _.get(toolbarItem.domainObject, item.property);
                    this.registerListener(toolbarItem.domainObject);
                    return toolbarItem;
                }.bind(this));
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
                this.structure = this.structure.map((item) => {
                    let toolbarItem = {...item};
                    let id = this.openmct.objects.makeKeyString(toolbarItem.domainObject.identifier);
                    let newObject = this.domainObjectsById[id].newObject;

                    if (newObject) {
                        toolbarItem.domainObject = newObject;
                        let newValue = _.get(newObject, item.property);

                        if (toolbarItem.value !== newValue) {
                            toolbarItem.value = newValue;
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
                    let id = this.openmct.objects.makeKeyString(toolbarItem.domainObject.identifier);

                    if (changedItemId === id && item.property === s.property) {
                        toolbarItem.value = value;
                    }

                    return toolbarItem;
                });
                this.openmct.objects.mutate(item.domainObject, item.property, value);
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
