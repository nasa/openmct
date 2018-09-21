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
            <div class="c-menu-button--w">
                <div class="c-menu-button js-layers icon-layers"></div>
            </div>
            <div class="c-menu-button--w">
                <div class="c-menu-swatch-button js-color-fill icon-paint-bucket">
                    <div class="c-menu-button__swatch"></div>
                </div>
            </div>

            <div class="c-menu-button--w">
                <div class="c-menu-swatch-button js-color-line icon-minus">
                    <div class="c-menu-button__swatch"></div>
                </div>
            </div>
            <div class="c-button icon-image"></div>
        </div>
        <div class="c-button-set">
            <labeledNumberInput label="X" value="1" title="X position"></labeledNumberInput>
            <labeledNumberInput label="Y" value="2" title="Y position"></labeledNumberInput>
            <labeledNumberInput label="W" value="3" title="Width"></labeledNumberInput>
            <labeledNumberInput label="H" value="4" title="Height"></labeledNumberInput>
        </div>
        <div class="c-button-set">
            <div class="c-button c-button--caution icon-trash"></div>
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
