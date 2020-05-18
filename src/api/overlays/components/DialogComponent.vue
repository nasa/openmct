<template>
<div class="c-message">
    <!--Uses flex-row -->
    <div
        class="c-message__icon"
        :class="['u-icon-bg-color-' + iconClass]"
    ></div>
    <div class="c-message__text">
        <!-- Uses flex-column -->
        <div
            v-if="title"
            class="c-message__title"
        >
            {{ title }}
        </div>

        <div
            v-if="hint"
            class="c-message__hint"
        >
            {{ hint }}
            <span v-if="timestamp">[{{ timestamp }}]</span>
        </div>

        <div
            v-if="message"
            class="c-message__action-text"
        >
            {{ message }}
        </div>
        <slot></slot>
    </div>
</div>
</template>

<script>
export default {
    inject: ['iconClass', 'title', 'hint', 'timestamp', 'message']
};
</script>
