<!--
 Open MCT, Copyright (c) 2014-2018, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.
 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.
 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<span class='l-indicators'></span>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .l-indicators {
        display: flex;
        align-items: center;
    }

    .c-indicator {
        @include cClickIconButtonLayout();

        &--clickable {
            @include cClickIconButton();
            @include hasMenu();
        }

        $bg: rgba(white, 0.2) !important;
        $hbg: $colorStatusBarBg;
        $hshdw: rgba(white, 0.4) 0 0 3px;
        $br: $controlCr;
        $hoverYOffset: -35px;
        /*background: transparent !important;*/
        border-radius: $br;
        /*display: inline-block;*/
        /*position: relative;*/
        //padding: 1px $interiorMarginSm; // Use padding instead of margin to keep hover chatter to a minimum
        text-transform: uppercase;

        &:before {
            /*display: inline-block;*/
        }

        .label {
            // Hover bubbles that appear when hovering on an Indicator
            display: inline-block;

            a,
            button,
            s-button,
            .c-button {
                // Make <a> in label look like buttons
                transition: $transIn;
                background: transparent;
                border: 1px solid rgba($colorStatusBarFg, 0.5);
                border-radius: $br;
                box-sizing: border-box;
                color: inherit;
                font-size: inherit;
                height: auto;
                line-height: normal;
                padding: 0 2px;
                &:hover {
                    background: $bg;
                    color: #fff;
                }
            }

            [class*='icon-'] {
                // If any elements within label include the class 'icon-*' then deal with their :before's
                &:before {
                    font-size: 0.8em;
                    margin-right: $interiorMarginSm;
                }
            }
        }

        &.no-collapse {
            display: flex;
            flex-flow: row nowrap;
            align-items: center;

            > *,
            &:before {
                flex: 1 1 auto;
            }

            &:before {
                margin-right: $interiorMarginSm;
            }
        }

        &:not(.no-collapse) {
            &:before {
                margin-right: 0 !important;
            }

            .label {
                transition: all 250ms ease-in 100ms;
                background: $hbg;
                border-radius: $br;
                font-size: .6rem;
                left: 0;
                top: 140%;
                opacity: 0;
                padding: $interiorMarginSm $interiorMargin;
                position: absolute;
                transform-origin: 10px 100%;
                transform: scale(0.0);
                white-space: nowrap;
                z-index: 50;

                &:before {
                    // Infobubble-style arrow element
                    content: '';
                    display: block;
                    position: absolute;
                    bottom: 100%;
                    @include triangle('up', $size: 4px, $ratio: 1, $color: $hbg);
                }
            }
        }

        &.float-right {
            float: right;
        }
    }

    /* Mobile */
    // Hide the clock indicator when we're phone portrait
    body.phone.portrait {
        .c-indicator.t-indicator-clock {
            display: none;
        }
    }
</style>

<script>
    export default {
        inject: ['openmct'],

        mounted() {
            this.openmct.indicators.indicatorObjects.forEach((indicator) => {
                // So that we can consistently position indicator elements,
                // guarantee that they are wrapped in an element we control
                // CH: fuck that...
                // var wrapperNode = document.createElement('span');
                // wrapperNode.className = 'u-contents';
                // wrapperNode.appendChild(indicator.element);
                this.$el.appendChild(indicator.element);
            });
        }
    }
</script>
