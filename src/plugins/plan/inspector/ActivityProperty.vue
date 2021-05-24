<template>
<li class="c-inspect-properties__row">
    <div class="c-inspect-properties__label">
        {{ label }}
    </div>
    <div class="c-inspect-properties__value">
        {{ value }}
    </div>
</li>
</template>

<script>

export default {
    props: {
        label: {
            type: String,
            default() {
                return '';
            }
        },
        value: {
            type: String,
            default() {
                return '';
            }
        }
    }
};
</script>
