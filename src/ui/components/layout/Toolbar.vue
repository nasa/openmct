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
            <div class="c-labeled-input">
                <div class="c-labeled-input__label">X</div>
                <input type="number" />
            </div>
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
    export default {       

    }
</script>
