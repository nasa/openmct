<template>
    <multipane class="c-inspector"
               type="vertical">
        <pane class="c-inspector__properties">
            c-inspector__properties
        </pane>
        <pane class="l-pane c-inspector__elements"
              handle="before">
            c-inspector__elements
        </pane>
    </multipane>
</template>

<style lang="scss">
    @import "~styles/constants";

    /******************************* INSPECTOR */
    .c-inspector {
        display: flex;
        flex-flow: column nowrap;
        height: 100%;

        > [class*="__"] {
            min-height: 50px;
            padding: $interiorMarginLg;
        }

        &__properties {
            flex: 1 1 auto;
        }

        &__elements {
            height: 25%;
            flex: 0 1 auto;
        }
    }
</style>

<script>
    import multipane from '../controls/multipane.vue';
    import pane from '../controls/pane.vue';
    export default {
        components: {
            multipane,
            pane
        }
    }
</script>
