<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
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
<div class="c-indicator t-indicator-user icon-person no-minify c-indicator--not-clickable">
    <span class="label c-indicator__label">
        {{ fullName }}
    </span>
</div>
</template>

<script>

export default {
    inject: ['openmct'],
    data() {
        return {
            userInfo: undefined
        };
    },
    computed: {
        fullName() {
            if (this.userInfo) {
                return this.userInfo.fullName;
            }

            return 'none';
        }
    },
    mounted() {
        if (this.openmct.user.isLoggedIn()) {
            this.setUserInfo();
        }

        this.openmct.user.on('logIn', this.setUserInfo);
        this.openmct.user.on('logOut', this.setUserInfo);
    },
    beforeDestroy() {
        this.openmct.user.off('logIn', this.setUserInfo);
        this.openmct.user.off('logOut', this.setUserInfo);
    },
    methods: {
        setUserInfo() {
            this.openmct.user.getCurrentUser().then((user) => {
                this.userInfo = user;
            });
        }
    }
};
</script>
