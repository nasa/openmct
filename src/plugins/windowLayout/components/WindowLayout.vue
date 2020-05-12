<template>
<div class="c-indicator c-indicator--clickable icon-save s-status-caution">
    <span class="label c-indicator__label">
        <button @click="persistWindowInformation">Save Windows</button>
        <button @click="openWindow">Open New Window</button>
    </span>
</div>
</template>
<script>
export default {
    inject: ['openmct'],
    mounted() {
        this.openWindows = {};
        this.windowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
        window.addEventListener("message", this.receiveMessage, false);
        if (window.opener) {
            window.opener.postMessage({
                status: 'READY',
                name: window.name
            },'*');
            window.addEventListener('beforeunload', () => {
                window.opener.postMessage({
                    status: 'CLOSED',
                    name: window.name
                },'*');
            });
            window.addEventListener('blur', () => {
                console.log('blurred');
                window.opener.postMessage({
                    query: 'QUERY__SIZE',
                    info: {
                        outerHeight: window.outerHeight,
                        outerWidth: window.outerWidth,
                        screenLeft: window.screenLeft,
                        screenTop: window.screenTop,
                        screenWidth: screen.width,
                        screenHeight: screen.height,
                        screenAvailableWidth: screen.availWidth,
                        screenAvailHeight: screen.availHeight,
                        devicePixelRatio: window.devicePixelRatio
                    },
                    name: window.name
                },'*');
            });
        }
    },
    methods: {
        persistWindowInformation() {
            window.localStorage.setItem('openmct-windowlayout-items',
                JSON.stringify(this.getOpenWindowSpecifications()));
        },
        openWindow() {
            let newWindowName = `Open MCT Window ${Object.keys(this.openWindows).length+1}`;
            this.openWindows[newWindowName] = window.open(window.location.href, newWindowName, this.windowFeatures);
        },
        receiveMessage(event) {
            const { data, origin, source} = event;
            switch(origin) {
            case 'http://localhost:8080':
                if (data) {
                    if (data.status === 'READY') {
                        let newWindowReference = this.openWindows[data.name];
                        newWindowReference.postMessage('QUERY__SIZE', 'http://localhost:8080');
                    } else if (data.status === 'CLOSED') {
                        this.openWindows[data.name] = undefined;
                        delete this.openWindows[data.name];
                        this.persistWindowInformation();
                    } else if (data === 'QUERY__SIZE') {
                        source.postMessage({
                            query: 'QUERY__SIZE',
                            info: {
                                outerHeight: window.outerHeight,
                                outerWidth: window.outerWidth,
                                screenLeft: window.screenLeft,
                                screenTop: window.screenTop,
                                screenWidth: screen.width,
                                screenHeight: screen.height,
                                screenAvailableWidth: screen.availWidth,
                                screenAvailHeight: screen.availHeight,
                                devicePixelRatio: window.devicePixelRatio
                            },
                            name: window.name
                        }, origin);
                    } else if (data.query === 'QUERY__SIZE') {
                        this.openWindows[data.name].info = data.info;
                        console.log(data.info);
                        this.persistWindowInformation();
                    }
                }

                break;
            default:
                break;
            }
        },
        getOpenWindowSpecifications() {
            return Object.keys(this.openWindows).map(key => {
                return {
                    name: key,
                    info: this.openWindows[key].info
                }
            });
        }
    }
}
</script>
