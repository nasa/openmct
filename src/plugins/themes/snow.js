export default function plugin() {
    return function install(openmct) {
        const links = document.getElementsByTagName("link");
        console.log('Theme: snow');
        for (let link of links) {
            console.log(link.href);
            // if (link.rel === 'stylesheet') {
            //     link.href = '';
            //     link.remove();
            // }
        }

        // var newlink = document.createElement("link");
        // newlink.setAttribute("rel", "stylesheet");
        // newlink.setAttribute("type", "text/css");
        // newlink.setAttribute("href", "dist/snow.css");

        document.getElementsByTagName("head").item(0).append(newlink);
    };
}
