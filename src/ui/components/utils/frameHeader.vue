<template>
    <div class="c-frame__header">
        <div class="c-frame__header__start">
            <div class="c-frame__name icon-object">{{ domainObject.name }}</div>
            <div class="c-frame__context-actions c-disclosure-button"></div>
        </div>
        <div class="c-frame__header__end">
            <div class="c-button icon-expand local-controls--hidden"></div>
        </div>
    </div>
</template>

<script>
export default {
    props:['domainObject']
}
</script>
