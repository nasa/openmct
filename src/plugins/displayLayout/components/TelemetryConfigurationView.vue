<template>
    <div class="c-properties">
        <div class="c-properties__header">Telemetry Configuration</div>
        <ul class="c-properties__section">
            <li class="c-properties__row">

            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        inject: ['openmct', 'domainObject'],
        // props: ['domainObject'],
        created: function() {
            let id = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            console.log("component created", id);
            let metadata = this.openmct.telemetry.getMetadata(this.domainObject);
            

        },
        methods() {

        }
    }
</script>