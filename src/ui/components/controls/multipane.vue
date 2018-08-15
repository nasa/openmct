<template>
    <div class="multipane"
         :class="{
             'multipane--vertical': type === 'vertical',
             'multipane--horizontal': type === 'horizontal'
         }">
        <slot></slot>
    </div>
</template>

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
