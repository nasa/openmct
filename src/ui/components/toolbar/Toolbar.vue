<template>
    <div class="c-toolbar">
        <component v-for="item in structure"
            :is="item.control"
            :options="item"
            @change="updateObjectValue"></component>
    </div>
</template>

<script>

    import toolbarAddMenu from './components/toolbar-add-menu.vue';
    import toolbarButton from './components/toolbar-button.vue';
    import toolbarColorPicker from './components/toolbar-color-picker.vue';
    import toolbarCheckbox from './components/toolbar-checkbox.vue';
    import toolbarInput from './components/toolbar-input.vue';
    import toolbarMenu from './components/toolbar-menu.vue';
    import toolbarSelectMenu from './components/toolbar-select-menu.vue';

    export default {
        inject: ['openmct'],
        components: {
            toolbarAddMenu,
            toolbarButton,
            toolbarColorPicker,
            toolbarCheckbox,
            toolbarInput,
            toolbarMenu,
            toolbarSelectMenu
        },
        methods: {
            handleSelection(selection) {
                let domainObject = selection[0].context.item;

                if (domainObject && domainObject === this.selectedObject) {
                    return;
                }

                this.selectedObject = domainObject;
                let structure = this.openmct.toolbars.get(selection) || [];
                this.structure = structure.map(function (item) {
                    let toolbarItem = {...item};
                    toolbarItem.control = "toolbar-" + toolbarItem.control;
                    return toolbarItem
                });
            },
            updateObjectValue(value, control) {
                console.log('todo: update object value', value, control);
            }
        },
        mounted() {
            this.openmct.selection.on('change', this.handleSelection);
            this.handleSelection(this.openmct.selection.get());
        },
        detroyed() {
            this.openmct.selection.off('change', this.handleSelection);
        },
        data: function () {
            return {
                structure: []
            };
        }
    }
</script>
