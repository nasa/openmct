<template>
<div class="c-menu">
    <ul>
        <li
            v-for="action in actions"
            :key="action.name"
            :class="action.cssClass"
            :title="action.description"
            @click="action.callBack"
        >
            {{ action.name }}
        </li>
        <li v-if="actions.length === 0">
            No actions defined.
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['actions']
}
</script>
