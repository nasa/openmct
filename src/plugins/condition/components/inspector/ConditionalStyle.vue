<template>
<div>
    <div v-if="conditionName"
         class="holder c-c-button-wrapper align-left"
    >
        <div>{{ conditionName }}</div>
    </div>
</div>
</template>

<script>

export default {
    components: {
    },
    inject: [
        'openmct'
    ],
    props: {
        conditionName: {
            type: String,
            required: true
        }
    },
    destroyed() {
    }
}
</script>
