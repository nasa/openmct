<template>
    <div class="c-splitter" :class="{
    'c-splitter-vertical' : align === 'vertical',
    'c-splitter-horizontal' : align === 'horizontal'
    }"></div>
</template>

<style lang="scss">
    .c-splitter {
        $c: #06f;
        $s: 10px;

        &:before {
            content: '';
            display: block;
            background: #ccc;
            position: absolute;
        }

        &:hover {
            background: rgba($c, 0.3);
            &:before {
                background: $c;
            }
        }

        &-vertical {
            cursor: col-resize;
            width: $s;
            &:before {
                // Divider line
                width: 1px;
                height: 100%;
                left: 50%;
                transform: translateX(-50%);
            }
        }

        &-horizontal {
            cursor: row-resize;
            height: $s;
            &:before {
                // Divider line
                width: 100%;
                height: 1px;
                top: 50%;
                transform: translateY(-50%);
            }
        }
    }
</style>

<script>
    export default {
        props: {
            align: String
        }
    }
</script>