<template>
    <div class="c-inspector">
        <div class="c-inspector__properties">
            l-inspector__properties XXX
        </div>
        <splitter cssClass="c-splitter--vert js-p-split-e"></splitter>
        <div class="c-inspector__elements">
            l-inspector__elements
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/constants";

    /******************************* INSPECTOR */
    .c-inspector {
        > [class*="__"] {
            padding: $interiorMarginLg;
        }
        .c-splitter {
            &:hover {
                background: red;
            }
        }
    }
</style>

<script>
    import splitter from '../controls/splitter.vue'
    export default {
        components: {
            splitter
        }
    }
</script>
