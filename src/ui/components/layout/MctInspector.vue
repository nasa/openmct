<template>
    <div class="c-inspector">
        <div class="c-inspector__properties">
            c-inspector__properties
        </div>
        <splitter align="horizontal"></splitter>
        <div class="l-pane c-inspector__elements">
            c-inspector__elements
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/constants";

    /******************************* INSPECTOR */
    .c-inspector {
        display: flex;
        flex-flow: column nowrap;
        height: 100%;

        > [class*="__"] {
            background: #f9c;
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
    import splitter from '../controls/splitter.vue'
    export default {
        components: {
            splitter
        }
    }
</script>
