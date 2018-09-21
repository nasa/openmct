<template>
    <div class="c-toolbar">
        <div class="c-button-set">
            <div class="c-menu-button--w">
                <div class="c-menu-button js-add-button icon-plus">
                    <div class="c-menu-button__label">Add</div>
                </div>
            </div>
        </div>
        <div class="c-button-set">
            <div class="c-toolbar-button--w">
                <div class="c-toolbar-button c-toolbar-button--menu js-layers icon-layers"></div>
            </div>

            <div class="c-toolbar-button--w">
                <div class="c-toolbar-button c-toolbar-button--color js-color-fill icon-paint-bucket">
                    <div class="c-toolbar-button__swatch" style="background: #33ff00;"></div>
                </div>
            </div>

            <div class="c-toolbar-button--w">
                <div class="c-toolbar-button c-toolbar-button--color js-color-stroke icon-pencil">
                    <div class="c-toolbar-button__swatch" style="background: #ffffff;"></div>
                </div>
            </div>

            <div class="c-toolbar-button--w">
                <div class="c-toolbar-button js-image icon-image"></div>
            </div>
        </div>
        <div class="c-button-set">
            <labeledNumberInput label="X" value="1" title="X position"></labeledNumberInput>
            <labeledNumberInput label="Y" value="2" title="Y position"></labeledNumberInput>
            <labeledNumberInput label="W" value="3" title="Width"></labeledNumberInput>
            <labeledNumberInput label="H" value="4" title="Height"></labeledNumberInput>
        </div>
        <div class="c-button-set">
            <div class="c-toolbar-button c-toolbar-button--caution icon-trash"></div>
        </div>
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-toolbar {
        display: flex;
        align-items: stretch;

        .c-labeled-input {
            font-size: 0.9em;
            width: 5em;
        }
    }
</style>

<script>
    import labeledNumberInput from '../controls/labeledNumberInput.vue';

    export default {
        components: {
            labeledNumberInput
        }

    }
</script>
