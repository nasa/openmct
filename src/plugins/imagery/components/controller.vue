<template>
    <div class="c-il-controller">
        Controller

        <div class="l-image-main-controlbar flex-elem l-flex-row">
            <div class="l-datetime-w flex-elem grows">
                <a class="c-button show-thumbs sm hidden icon-thumbs-strip"
                    @click="showThumbsBubble = (showThumbsBubble) ? false:true"></a>
                <span class="l-time">{{imagery.getTime()}}</span>
            </div>
            <div class="h-local-controls flex-elem">
                <a class="c-button icon-pause pause-play"
                    @click="imagery.paused(!imagery.paused())"
                    :class="{'is-paused': imagery.paused()}"></a>
                <a href=""
                    class="s-button l-mag s-mag vsm icon-reset"
                    @click="clipped = false"
                    ng-show="clipped === true"
                    title="Not all of image is visible; click to reset."></a>
            </div>
        </div>
    </div>
</template>