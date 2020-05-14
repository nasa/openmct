<template>
<div v-if="!isOpener"
     class="c-indicator c-indicator--clickable icon-save s-status-caution"
>
    <span class="label c-indicator__label">
        <button @click="open2Windows">Open 2 Windows</button>
        <button @click="closeAllWindows">Close Windows</button>
        <button @click="openSavedWindows">Open Saved Windows</button>
    </span>
</div>
</template>
<script>
export default {
    inject: ['openmct'],
    computed: {
        isOpener() {
            return window.opener;
        }
    },
    mounted() {
        this.openWindows = {};
        this.windowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes,innerHeight=480,innerWidth=640,screenY=100";
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
                window.opener.postMessage({
                    query: 'QUERY__SIZE',
                    info: {
                        innerHeight: window.innerHeight,
                        innerWidth: window.innerWidth,
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
        getScreenX() {
            return !Object.keys(this.openWindows).length ? 100: (screen.width - (Object.keys(this.openWindows).length*640));
        },
        open2Windows() {
            this.openWindow(`${this.windowFeatures},screenX=${this.getScreenX()}`);
            this.openWindow(`${this.windowFeatures},screenX=${this.getScreenX()}`);
        },
        openWindow(windowFeatures) {
            let newWindowName = `Open MCT Window ${Object.keys(this.openWindows).length+1}`;
            this.openWindows[newWindowName] = { windowReference: window.open(window.location.href, newWindowName, windowFeatures)};
        },
        moveWindow() {
            const key = Object.keys(this.openWindows)[0];
            this.openWindows[key].postMessage({
                command: 'moveTo',
                params: [window.screenLeft + 40, window.screenTop + 40]
            }, 'http://localhost:8080');
        },
        openSavedWindows() {
            const persistedWindowObjs = window.localStorage.getItem('openmct-windowlayout-items');
            if (persistedWindowObjs) {
                const windowObjs = JSON.parse(persistedWindowObjs);
                windowObjs.forEach(windowObj => {
                    let newWindowName = windowObj.name;
                    const features = `menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes,innerHeight=${windowObj.info.innerHeight || 480},innerWidth=${windowObj.info.innerWidth || 640},screenX=${windowObj.info.screenLeft || this.getScreenX()},screenY=${windowObj.info.screenTop || 100}`;
                    const windowReference = window.open(window.location.href, newWindowName, features);
                    this.openWindows[newWindowName] = {
                        windowReference,
                        name: newWindowName,
                        info: windowObj.info
                    }
                });
            }
        },
        closeAllWindows() {
            this.persistWindowInformation();
            Object.keys(this.openWindows).forEach((windowName => {
                const windowObj = this.openWindows[windowName];
                windowObj.closedByOpener = true;
                windowObj.windowReference.close();
            }));
        },
        receiveMessage(event) {
            const { data, origin, source} = event;
            switch(origin) {
            case 'http://localhost:8080':
                if (data) {
                    if (data.status === 'READY') {
                        let newWindowReference = this.openWindows[data.name].windowReference;
                        newWindowReference.postMessage({
                            command: 'QUERY__SIZE'
                        }, 'http://localhost:8080');
                    } else if (data.status === 'CLOSED') {
                        const closedByOpener = this.openWindows[data.name].closedByOpener;
                        this.openWindows[data.name] = undefined;
                        delete this.openWindows[data.name];
                        if (!closedByOpener) {
                            this.persistWindowInformation();
                        }
                    } else if (data.command) {
                        switch(data.command) {
                        case 'QUERY__SIZE':
                            source.postMessage({
                                query: data.command,
                                info: {
                                    innerHeight: window.innerHeight,
                                    innerWidth: window.innerWidth,
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
                            break;
                        default:
                            window[data.command](...data.params);
                            this.$nextTick(() => {
                                source.postMessage({
                                    query: data.command,
                                    name: window.name
                                }, origin);
                            });
                            break;
                        }
                    } else if (data.query) {
                        if (data.info) {
                            if (!this.openWindows[data.name]) {
                                return;
                            }
                            this.openWindows[data.name].info = data.info;
                            console.log(data.info);
                            this.persistWindowInformation();
                        } else {
                            if (!this.openWindows[data.name]) {
                                return;
                            }
                            let newWindowReference = this.openWindows[data.name].windowReference;
                            newWindowReference.postMessage({
                                command: 'QUERY__SIZE'
                            }, 'http://localhost:8080');
                        }
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
