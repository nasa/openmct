/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<div ref="compassRoseWrapper"
    class="w-direction-rose"
    :class="compassRoseSizingClasses"
    @click="toggleLockCompass"
>
    <svg ref="compassRoseSvg"
         class="c-compass-rose-svg"
         viewBox="0 0 100 100"
    >
        <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            <circle cx="50" cy="50" r="50" fill="black"/>
        </mask>
        <g class="c-cr__compass-wrapper">
            <g class="c-cr__compass-main" mask="url(#mask0)">
                <rect class="c-cr__bg" width="100" height="100" fill="black"/>
                <rect class="c-cr__edge" width="100" height="100" fill="url(#paint0_radial)"/>
                <rect class="c-cr__sun" width="100" height="100" fill="url(#paint1_radial)"/>

                <!-- Cam FOV -->
                <mask class="c-cr__cam-fov-l-mask" id="mask2" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="50" height="100">
                    <rect width="51" height="100"/>
                </mask>
                <mask class="c-cr__cam-fov-r-mask" id="mask1" mask-type="alpha" maskUnits="userSpaceOnUse" x="50" y="0" width="50" height="100">
                    <rect x="49" width="51" height="100"/>
                </mask>
                <g class="c-cr__cam-fov">
                    <g mask="url(#mask1)">
                        <rect class="c-cr__cam-fov-l" x="49" width="51" height="100"
                            style="transform: rotate(-110deg)"
                        />
                    </g>
                    <g mask="url(#mask2)">
                        <rect class="c-cr__cam-fov-r" width="51" height="100"
                              style="transform: rotate(110deg)"
                        />
                    </g>
                </g>
            </g>

            <!-- Spacecraft body -->
            <path class="c-cr__spacecraft-body"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M37 49C35.3431 49 34 50.3431 34 52V82C34 83.6569 35.3431 85 37 85H63C64.6569 85 66 83.6569 66 82V52C66 50.3431 64.6569 49 63 49H37ZM50 52L58 60H55V67H45V60H42L50 52Z"
            />

            <!-- NSEW and ticks -->
            <g class="c-cr__nsew"
                style="transform: rotate(30deg)"
            >
                <g class="c-cr__ticks-major">
                    <path d="M50 3L43 10H57L50 3Z"/>
                    <path d="M4 51V49H10V51H4Z" class="--hide-min"/>
                    <path d="M49 96V90H51V96H49Z" class="--hide-min"/>
                    <path d="M90 49V51H96V49H90Z" class="--hide-min"/>
                </g>
                <g class="c-cr__ticks-minor --hide-small">
                    <path d="M4 51V49H10V51H4Z"/>
                    <path d="M90 51V49H96V51H90Z"/>
                    <path d="M51 96H49V90H51V96Z"/>
                    <path d="M51 10L49 10V4L51 4V10Z"/>
                </g>
                <g class="c-cr__nsew-text">
                    <path d="M25.7418 45.004H23.1378L21.7238 52.312H21.6958L20.2258 45.004H17.7758L16.3058 52.312H16.2778L14.8638 45.004H12.2598L14.9618 55H17.6078L18.9798 48.112H19.0078L20.3798 55H22.9838L25.7418 45.004Z"/>
                    <path d="M79.104 55H87.21V52.76H81.708V50.856H86.608V48.84H81.708V47.09H87.07V45.004H79.104V55Z"/>
                    <path d="M45.6531 83.64C45.6671 86.202 47.6971 87.21 49.9931 87.21C52.1911 87.21 54.3471 86.398 54.3471 83.864C54.3471 82.058 52.8911 81.386 51.4491 80.98C49.9931 80.574 48.5511 80.434 48.5511 79.664C48.5511 79.006 49.2511 78.81 49.8111 78.81C50.6091 78.81 51.4631 79.104 51.4211 80.014H54.0251C54.0111 77.76 52.0091 76.794 50.0211 76.794C48.1451 76.794 45.9471 77.648 45.9471 79.832C45.9471 81.666 47.4451 82.31 48.8731 82.716C50.3151 83.122 51.7431 83.29 51.7431 84.172C51.7431 84.914 50.9311 85.194 50.1471 85.194C49.0411 85.194 48.3131 84.816 48.2571 83.64H45.6531Z"/>
                    <path d="M42.5935 31H46.7935V20.32H46.8415L52.7935 31H57.3775V13.864H53.1775V24.424H53.1295L47.1775 13.864H42.5935V31Z"/>
                </g>
            </g>
        </g>
        <defs>
            <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(50)">
                <stop offset="0.751387" stop-opacity="0"/>
                <stop offset="1" stop-color="white"/>
            </radialGradient>
            <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 -7) rotate(-90) scale(18.5)">
                <stop offset="0.716377" stop-color="#FFCC00"/>
                <stop offset="1" stop-color="#FF9900" stop-opacity="0"/>
            </radialGradient>
        </defs>
    </svg>
</div>
</template>

<script>
import { rotate } from './utils';
import { throttle } from 'lodash';

export default {
    props: {
        compassRoseSizingClasses: {
            type: String,
            required: true
        },
        heading: {
            type: Number,
            required: true,
            default() {
                return 0;
            }
        },
        sunHeading: {
            type: Number,
            default: undefined
        },
        cameraAngleOfView: {
            type: Number,
            default: undefined
        },
        cameraPan: {
            type: Number,
            required: true,
            default() {
                return 0;
            }
        },
        sizedImageDimensions: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            lockCompass: true
        };
    },
    computed: {
        compassRoseStyle() {
            return { transform: `rotate(${ this.north }deg)` };
        },
        north() {
            return this.lockCompass ? rotate(-this.cameraPan) : 0;
        },
        northTextTransform() {
            return this.cardinalPointsTextTransform.north;
        },
        eastTextTransform() {
            return this.cardinalPointsTextTransform.east;
        },
        southTextTransform() {
            return this.cardinalPointsTextTransform.south;
        },
        westTextTransform() {
            return this.cardinalPointsTextTransform.west;
        },
        cardinalPointsTextTransform() {
            /**
             * cardinal points text must be rotated
             * in the opposite direction that north is rotated
             * to keep text vertically oriented
             */
            const rotation = `rotate(${ -this.north })`;

            return {
                north: `translate(50,23) ${ rotation }`,
                east: `translate(82,50) ${ rotation }`,
                south: `translate(18,50) ${ rotation }`,
                west: `translate(50,82) ${ rotation }`
            };
        },
        hasHeading() {
            return this.heading !== undefined;
        },
        headingStyle() {
            const rotation = rotate(this.north, this.heading);

            return {
                transform: `translateX(-50%) rotate(${ rotation }deg)`
            };
        },
        hasSunHeading() {
            return this.sunHeading !== undefined;
        },
        sunHeadingStyle() {
            const rotation = rotate(this.north, this.sunHeading);

            return {
                transform: `rotate(${ rotation }deg)`
            };
        },
        cameraPanStyle() {
            const rotation = rotate(this.north, this.cameraPan);

            return {
                transform: `rotate(${ rotation }deg)`
            };
        },
        // left half of camera field of view
        // rotated counter-clockwise from camera pan angle
        cameraFOVStyleLeftHalf() {
            return {
                transform: `translateX(50%) rotate(${ -this.cameraAngleOfView / 2 }deg)`
            };
        },
        // right half of camera field of view
        // rotated clockwise from camera pan angle
        cameraFOVStyleRightHalf() {
            return {
                transform: `translateX(-50%) rotate(${ this.cameraAngleOfView / 2 }deg)`
            };
        }
    },
    watch: {
        sizedImageDimensions() {
            this.debounceResizeSvg();
        }
    },
    mounted() {
        this.debounceResizeSvg = throttle(this.resizeSvg, 100);

        this.$nextTick(() => {
            this.debounceResizeSvg();
        });
    },
    methods: {
        resizeSvg() {
            const svg = this.$refs.compassRoseSvg;
            svg.setAttribute('width', this.$refs.compassRoseWrapper.clientWidth);
            svg.setAttribute('height', this.$refs.compassRoseWrapper.clientHeight);
        },
        toggleLockCompass() {
            this.lockCompass = !this.lockCompass;
        }
    }
};
</script>
