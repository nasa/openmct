export default function plugin() {
    return function install(openmct) {
        const links = document.getElementsByTagName("link");
        console.log('Theme: espresso');
        for (let link of links) {
            const isTheme = link.href.indexOf('Theme') > -1;
            console.log(link.href, isTheme);
            if (isTheme && link.rel === 'stylesheet'
                    && link.type === 'text/css') {
                console.log(link.href, isTheme);
                link.href = 'dist/espressoTheme.css';
            //     link.remove();
            }
        }

        // var newlink = document.createElement("link");
        // newlink.setAttribute("rel", "stylesheet");
        // newlink.setAttribute("type", "text/css");
        // newlink.setAttribute("href", "dist/espresso.css");

        // document.getElementsByTagName("head").item(0).append(newlink);
    };
}
