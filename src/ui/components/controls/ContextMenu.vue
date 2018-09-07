<template>
    <div class="c-menu">
        <ul>
            <li v-for="item in contextMenuItems"
                :class="item.class"
                :title="item.title">
                {{ item.name }}
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        data: function () {
            return {
                contextMenuItems: [
                    {name: 'Open In New Tab', class: 'icon-new-window', title: 'Open in a new browser tab'},
                    {name: 'Preview', class: 'hide-in-t-main-view icon-eye-open', title: 'Preview in large dialog'},
                    {name: 'Edit Properties...', class: 'major icon-pencil', title: 'Edit properties of this object.'},
                    {name: 'Duplicate', class: 'icon-duplicate', title: 'Duplicate object to another location.'},
                    {name: 'Create Link', class: 'icon-link', title: 'Create Link to object in another location.'},
                    {name: 'Export as JSON', class: 'icon-export', title: 'Export as JSON'},
                    {name: 'Import from JSON', class: 'icon-import', title: 'Import from JSON'}
                ]
            }
        }
    }
</script>