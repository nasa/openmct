<template>
    <div class="c-so-view__context-actions c-disclosure-button"
         @click="showContextMenu"></div>
</template>

<script>
import contextMenu from '../../../ui/components/mixins/context-menu'

export default {
    props: ['object-path'],
    mixins: [contextMenu]
}
</script>

