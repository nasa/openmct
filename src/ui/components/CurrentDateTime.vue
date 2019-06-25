<template>
    <div class="c-indicator no-collapse icon-clock c-current-datetime">
        <span class="label">{{ currentDateTime }} UTC</span>
    </div>
</template>

<script>
    import moment from 'moment';

    export default {
        data() {
            return {
                currentDateTime: moment.utc().format('LTS')
            }
        },
        mounted: function() {
            setInterval(()=>{
                this.currentDateTime = moment.utc().format('YYYY/MM/DD HH:mm:ss')
            },100)
        }
    }
</script>