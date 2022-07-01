<template>
<div
    class="c-imagery__thumb c-thumb"
    :class="{
        'active': active,
        'selected': selected,
        'real-time': realTime
    }"
    :title="image.formattedTime"
>
    <a
        href=""
        :download="image.imageDownloadName"
        @click.prevent
    >
        <img
            class="c-thumb__image"
            :src="image.url"
        >
    </a>
    <div class="c-thumb__timestamp">{{ image.formattedTime }}</div>
</div>
</template>

<script>
export default {
    props: {
        image: {
            type: Object,
            required: true
        },
        active: {
            type: Boolean,
            required: true
        },
        selected: {
            type: Boolean,
            required: true
        },
        realTime: {
            type: Boolean,
            required: true
        }
    }
};
</script>
