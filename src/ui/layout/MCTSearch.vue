<template>
<div class="c-search c-search--major">
    <input
        type="search"
        placeholder="Search"
    >
</div>
</template>

<style lang="scss">
    @import "~styles/constants";

    /******************************* SEARCH */
    .c-search {
        input[type=search] {
            width: 100%;
        }

        &--major {
            display: flex;
        }
    }
</style>

<script>
export default {
}
</script>
