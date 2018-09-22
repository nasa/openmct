<template>
    <div class="c-toolbar">
        <div class="c-button-set">
            <div class="c-ctrl-wrapper">
                <div class="c-button--menu js-add-button icon-plus">
                    <div class="c-button__label">Add</div>
                </div>
            </div>
        </div>
        <div class="c-button-set">
            <div class="c-ctrl-wrapper">
                <div class="c-click-icon c-click-icon--menu js-layers icon-layers"></div>
            </div>

            <div class="c-ctrl-wrapper">
                <div class="c-click-icon c-click-icon--swatched js-color-fill icon-paint-bucket">
                    <div class="c-swatch" style="background: #33ff00;"></div>
                </div>
            </div>

            <div class="c-ctrl-wrapper">
                <div class="c-click-icon c-click-icon--swatched js-color-stroke icon-pencil">
                    <div class="c-toolbar-button__swatch" style="background: #ffffff;"></div>
                </div>
            </div>

            <div class="c-ctrl-wrapper">
                <div class="c-click-icon js-image icon-image"></div>
            </div>
        </div>
        <div class="c-button-set">
            <labeledNumberInput label="X" value="1" title="X position"></labeledNumberInput>
            <labeledNumberInput label="Y" value="2" title="Y position"></labeledNumberInput>
            <labeledNumberInput label="W" value="3" title="Width"></labeledNumberInput>
            <labeledNumberInput label="H" value="4" title="Height"></labeledNumberInput>
        </div>
        <div class="c-button-set">
            <div class="c-click-icon c-click-icon--caution icon-trash"></div>
        </div>
    </div>
</template>

<script>
    import labeledNumberInput from '../controls/labeledNumberInput.vue';

    export default {
        components: {
            labeledNumberInput
        }

    }
</script>
