<template>
    <div class="c-button-set">
        <div class="c-ctrl-wrapper">
            <div class="c-button--menu js-add-button icon-plus"
                @click="toggleMenus">
                <div class="c-button__label">Add</div>
            </div>
            <div class="c-menu" v-if="showMenus">
                <ul>
                    <li v-for="item in addMenuItems"
                        :class="item.class"
                        :title="item.title">
                        {{ item.name }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
}
</script>
