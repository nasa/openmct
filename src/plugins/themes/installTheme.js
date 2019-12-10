export const installTheme = (themeName) => {
    const links = document.getElementsByTagName("link");
    for (let link of links) {
        const isTheme = link.href.includes('Theme')
                || link.href.includes('openmct.css');
        if (isTheme && link.rel === 'stylesheet'
                && link.type === 'text/css') {
            const hasDist = link.getAttribute('href').includes('dist');
            const filePath = hasDist ? 'dist/' : '';
            link.href = `${filePath}${themeName}Theme.css`;
        }
    }
}
