// ==UserScript==
// @name         C411 overlay F1
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  my overlay
// @author       Fabonymous
// @match        https://c411.org/torrents?q=f1&cat=1
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c411.org
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';

    const fabonymous = {
        version: '0.2',
        alert: (name) => {GM_xmlhttpRequest({method:"GET",url:`http://localhost:3411/alert?name=${name}`});},
        run: () => {
            console.log('Fabonymous running...');
            document.querySelector("header").style.display = 'none';
            const divs = document.querySelector('main').querySelectorAll('div');
            let pixelToScroll = 0;
            let firstorrent = true;
            divs.forEach(div => {
                if(div.classList.contains('dark:divide-emerald-800/30')) {
                    if(!div.classList.contains('relative')) {
                        const torrentList = div.querySelectorAll(':scope > div');
                        pixelToScroll = torrentList[0].getBoundingClientRect().top + window.scrollY;
                        torrentList.forEach(torrent => {
                            const line = torrent.children[0];
                            const torrentType = line.children[0];
                            const torrentName = line.children[1].children[0].children[0];
                            const torrentCom = line.children[2];
                            const torrentTime = line.children[3];
                            const torrentSize = line.children[4];
                            const torrentDone = line.children[5];
                            const torrentSeed = line.children[6];
                            const torrentLeech = line.children[7];
                            // Size
                            let skip2big = false;
                            if(torrentSize.innerText.indexOf(' Go') != -1 && parseInt(torrentSize.innerText.replace(' Go','')) > 10) { skip2big = true; }
                            if(torrentSize.innerText.indexOf(' To') != -1) { skip2big = true; }
                            if(skip2big === false) {
                                // Time
                                if(torrentTime.innerText.indexOf('min') > -1) {
                                    let sinceMin = parseInt(torrentTime.innerText.replace(' min',''));
                                    if(sinceMin <= 3) {
                                        // ALERT
                                        if(firstorrent) {
                                            firstorrent = false;
                                            fabonymous.alert(torrentName.innerHTML);
                                        }
                                        torrentName.style.color = 'white';
                                        torrentTime.classList.replace('text-xs', 'text-xl');
                                        torrentTime.classList.remove('text-muted');
                                        torrentTime.style.color = 'white';
                                        torrentSize.classList.replace('text-xs', 'text-xl');
                                        torrentSize.classList.remove('text-muted');
                                        torrentSize.style.color = 'white';
                                        let t = setInterval(() => {
                                            torrentTime.style.visibility = (torrentTime.style.visibility == 'hidden' ? '' : 'hidden');
                                            torrentSize.style.visibility = (torrentSize.style.visibility == 'hidden' ? '' : 'hidden');
                                        }, 300);
                                    } else if(sinceMin <= 5) {
                                        torrentTime.classList.replace('text-xs', 'text-xl');
                                        torrentTime.classList.remove('text-muted');
                                        torrentTime.style.color = 'lightgreen';
                                        torrentSize.classList.replace('text-xs', 'text-xl');
                                        torrentSize.classList.remove('text-muted');
                                        torrentSize.style.color = 'lightgreen';
                                        let t = setInterval(() => {
                                            torrentTime.style.visibility = (torrentTime.style.visibility == 'hidden' ? '' : 'hidden');
                                            torrentSize.style.visibility = (torrentSize.style.visibility == 'hidden' ? '' : 'hidden');
                                        }, 500);
                                    } else if(sinceMin <= 9) {
                                        torrentTime.classList.replace('text-xs', 'text-xl');
                                        torrentTime.classList.remove('text-muted');
                                        torrentTime.style.color = 'yellow';
                                        torrentSize.classList.replace('text-xs', 'text-xl');
                                        torrentSize.classList.remove('text-muted');
                                        torrentSize.style.color = 'yellow';
                                        let t = setInterval(() => {
                                            torrentTime.style.visibility = (torrentTime.style.visibility == 'hidden' ? '' : 'hidden');
                                            torrentSize.style.visibility = (torrentSize.style.visibility == 'hidden' ? '' : 'hidden');
                                        }, 900);
                                    } else if(sinceMin <= 15) {
                                        torrentTime.classList.replace('text-xs', 'text-l');
                                        torrentTime.classList.remove('text-muted');
                                        torrentTime.style.color = 'orange';
                                        torrentSize.classList.replace('text-xs', 'text-l');
                                        torrentSize.classList.remove('text-muted');
                                        torrentSize.style.color = 'orange';
                                    }
                                }
                            }
                        });
                    }
                }
            });
            window.scrollTo(0, pixelToScroll);
            console.log('Fabonymous done.');
        },
    }

    console.log(`Fabonymous ${fabonymous.version} loaded.`);

    // Wait loading page
    let w8t = setInterval( () => {
        if(document.querySelector("header") !== null) {
            clearInterval(w8t);
            setTimeout( () => {
                // Run
                fabonymous.run();
                // Refresh
                setTimeout( () => { window.location.reload(); }, 60_000);
                let sec = 59;
                setInterval( () => {
                    document.title = `Fabonymous | ${sec--}`;
                    if(sec<0) { window.location.reload(); }
                }, 1_000);
            }, 100);
        }
    }, 100);
})();
