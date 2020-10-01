<template>
<div class="c-menu">
    <ul>
        <li
            v-for="(item, index) in popupMenuItems"
            :key="index"
            :class="item.cssClass"
            :title="item.name"
            @click="item.callback"
        >
            {{ item.name }}
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['popupMenuItems']
};
</script>
