<template>
<div
    class="c-compass__hud c-hud"
>
    <div
        class="c-hud__dir"
        style="left: 90%"
    >N</div>
    <div
        class="c-hud__dir"
        style="left: 22%"
    >NW</div>
    <div
        class="c-hud__sun"
        style="left: 83%"
    ></div>
    <div class="c-hud__range"></div>
</div>
</template>

<script>
export default {
    props: {
        // degrees from north heading
        roverHeading: {
            type: Number,
            required: true
        },
        // degrees from north heading
        sunHeading: {
            type: Number,
            default: undefined
        }
    }
};
</script>
