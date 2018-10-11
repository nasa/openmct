<template>
    <div class="c-toolbar">
        <component v-for="item in structure"
            :is="item.control"
            :options="item"
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
                if (!selection[0]) {
                    this.structure = [];
                    this.selectedObject = undefined;
                    this.removeListeners();
                    return;
                }

                let domainObject = selection[0].context.item;

                this.selectedObject = domainObject;
                this.removeListeners();

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
                let unobserveObject = this.openmct.objects.observe(domainObject, '*', function(newObject) {
                    let newObjectId = this.openmct.objects.makeKeyString(newObject.identifier);
                    this.structure = this.structure.map((item) => {
                        let toolbarItem = {...item};
                        let domainObjectId = this.openmct.objects.makeKeyString(toolbarItem.domainObject.identifier);
                        if (domainObjectId === newObjectId) {
                            toolbarItem.domainObject = JSON.parse(JSON.stringify(newObject));
                        }
                        return toolbarItem;
                    });
                }.bind(this));
                this.unObserveObjects.push(unobserveObject);
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
                let changedId = this.openmct.objects.makeKeyString(item.domainObject.identifier);
                this.structure = this.structure.map((s) => {
                    let toolbarItem = {...s};
                    if (changedId === this.openmct.objects.makeKeyString(toolbarItem.domainObject.identifier)) {
                        toolbarItem.value = value;
                    }
                    return toolbarItem;
                });
                this.openmct.objects.mutate(item.domainObject, item.property, value);
            }
        },
        mounted() {
            this.openmct.selection.on('change', this.handleSelection);
            this.handleSelection(this.openmct.selection.get());

            // Toolbars may change when edit mode is enabled/disabled, so listen
            // for edit mode changes and update toolbars if necessary.
            this.openmct.editor.on('isEditing', (isEditing) => {
                this.handleSelection(this.openmct.selection.get());
            });
        },
        detroyed() {
            this.openmct.selection.off('change', this.handleSelection);
            this.removeListeners();
        }
    }
</script>
