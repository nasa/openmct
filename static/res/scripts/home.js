$().ready(function () {
    const WAIT = 15 * 1000;
    let heroes = $('.l-hero-main');
    let activeHero = 0;
    let $pager = $('.hero-pager');
    let cycleTimeout;
    for (let j = 0; j < heroes.length; j++) {
        $p = $('<a class="pager-dot" id="' + j + '"></a>').appendTo($pager);
        $p.on('click', function() { setActiveHero(parseInt(this.id)); });
    }
    let $pagerDots = $('.pager-dot');
    $($pagerDots[0]).addClass('active');

    function setActiveHero(index) {
        clearTimeout(cycleTimeout);
        if (activeHero != index) {
            heroes.addClass('hidden'); // Hide all heroes
            $pagerDots.removeClass('active');  // Deactivate all pager dots
            $(heroes[index]).removeClass('hidden'); // Show the selected hero
            $($pagerDots[index]).addClass('active'); // Activate the right pager dot
            activeHero = index; // Update activeHero
        }
        cycleTimeout = setTimeout(cycleHeroes, WAIT * 2); // Wait longer because user clicked
    }

    function cycleHeroes() {
        $(heroes[activeHero]).addClass('hidden');
        $($pagerDots[activeHero]).removeClass('active');
        activeHero = activeHero + 1 === heroes.length ? 0 : activeHero + 1;
        $(heroes[activeHero]).removeClass('hidden');
        $($pagerDots[activeHero]).addClass('active');
        cycleTimeout = setTimeout(cycleHeroes, WAIT);
    }
    cycleTimeout = setTimeout(cycleHeroes, WAIT);
});
