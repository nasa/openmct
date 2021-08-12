<template>
<div v-if="imageObject"
     class="image-wrapper"
     :style="{
         'text-align': 'center'
     }"
>
    <img ref="focusedImage"
         :alt="imageObject.url"
         :title="imageObject.formattedTime"
         class="c-imagery__main-image__image js-imageryView-image"
         :src="imageObject.url"
    >
    <div class="c-thumb__timestamp">{{ imageObject.formattedTime }} (Timestamp: {{ imageObject.time }})</div>
</div>
</template>

<script>
export default {
    props: {
        imageObject: {
            type: Object,
            required: true
        }
    }

};
</script>
