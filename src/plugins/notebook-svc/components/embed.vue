<template>
        <div class="c-ne__embed">
        <div class="c-ne__embed__snap-thumb"
            v-if="embed.snapshot">
            <img v-bind:src="embed.snapshot.src">
        </div>
        <div class="c-ne__embed__info">
            <div class="c-ne__embed__name">
                <a class="c-ne__embed__link"
                :href="objectLink"
                :class="embed.cssClass">{{embed.name}}</a>
                <a class="c-ne__embed__context-available icon-arrow-down"></a>
            </div>
            <div class="hide-menu hidden">
                <div class="menu-element context-menu-wrapper mobile-disable-select">
                    <div class="c-menu">
                        <!-- <ul>
                            <li v-for="action in actions"
                                :key="action.name" 
                                :class="action.cssClass"
                                @click="action.perform(embed, entry)">
                                {{ action.name }}
                            </li> 
                        </ul> -->
                    </div>
                </div>
            </div>
            <div class="c-ne__embed__time" v-if="embed.snapshot">
                    {{formatTime(embed.createdOn, 'YYYY-MM-DD HH:mm:ss')}}
            </div>
        </div>
    </div>
</template>

<script>
import objectLinkMixin from '../../../ui/mixins/object-link';

export default {
    inject: ['openmct', 'formatTime'],
    props: ['embed'],
    mixins: [objectLinkMixin]
}
</script>
