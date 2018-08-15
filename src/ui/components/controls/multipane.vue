<template>
    <div class="multipane"
         :class="{
             'multipane--vertical': type === 'vertical',
             'multipane--horizontal': type === 'horizontal'
         }">
        <slot></slot>
    </div>
</template>

<style lang="scss">
.multipane {
    $backgroundColor: #06f;
    $size: 10px;

    & > .multipane__pane > .multipane__splitter {
        z-index: 1;
        display: block;
        background: #ccc;
        position: absolute;

        &:before {
            content: '';
        }

        &:hover {
            background: rgba($backgroundColor, 0.3);
            &:before {
                background: $backgroundColor;
            }
        }
    }

    &--horizontal > .multipane__pane > .multipane__splitter {
        cursor: col-resize;
        width: $size;
        top: 0px;
        bottom: 0px;
        &--before {
            left: (- $size / 2);
        }
        &--after {
            right: (- $size / 2);
        }
        &:before {
            // Divider line
            width: 1px;
            height: 100%;
            left: 50%;
            transform: translateX(-50%);
        }
    }

    &--vertical > .multipane__pane > .multipane__splitter {
        cursor: row-resize;
        height: $size;
        left: 0px;
        right: 0px;
        &--before {
            top: (- $size / 2);
        }
        &--after {
            left: (- $size / 2);
        }

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
        type: {
            type: String,
            validator: function (value) {
                return ['vertical', 'horizontal'].indexOf(value) !== -1;
            }
        }
    }
}
</script>
