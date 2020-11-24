<template>
<div class="c-attributes-view">
    <div class="c-overlay__top-bar">
        <div class="c-overlay__dialog-title">{{ name }}</div>
    </div>
    <div class="c-overlay__contents-main l-preview-window__object-view">
        <ul class="c-attributes-view__content">
            <li
                v-for="attribute in Object.keys(attributes)"
                :key="attribute"
            >
                <span class="c-attributes-view__grid-item__label">{{ attribute }}</span>
                <span class="c-attributes-view__grid-item__value">{{ attributes[attribute] }}</span>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
export default {
    inject: ['name', 'attributes']
};
</script>
