// ==UserScript==
// @name         C411 overlay F1
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  my overlay with dynamic refresh slider and dynamic size filter
// @author       Fabonymous
// @match        https://c411.org/torrents?q=f1&cat=1
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c411.org
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';
    const fabonymous = {
        version: '0.6',
        alert: (name) => {GM_xmlhttpRequest({method:"GET",url:`http://localhost:3411/alert?name=${name}`});},
        run: () => {
            console.log('Fabonymous running...');
            document.querySelector("header").style.display = 'none';
            const divs = document.querySelector('main').querySelectorAll('div');
            let pixelToScroll = 0;
            let firstorrent = true;
            const maxSizeAllowed = parseFloat(GM_getValue('maxTorrentSize', 10));
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
                            let skip2big = false;
                            if(torrentSize.innerText.indexOf(' Go') != -1) {
                                const sizeGo = parseFloat(torrentSize.innerText.replace(' Go',''));
                                if(sizeGo > maxSizeAllowed) { skip2big = true; }
                            }
                            if(torrentSize.innerText.indexOf(' To') != -1) { skip2big = true; }
                            if(torrentSize.innerText.indexOf(' Mo') != -1) {
                                const sizeMo = parseFloat(torrentSize.innerText.replace(' Mo',''));
                                if((sizeMo / 1000) > maxSizeAllowed) { skip2big = true; }
                            }
                            if(skip2big === false) {
                                if(torrentTime.innerText.indexOf('min') > -1) {
                                    let sinceMin = parseInt(torrentTime.innerText.replace(' min',''));
                                    if(sinceMin <= 3) {
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
        initOverlay: (currentDelay, currentMaxSize, onDelayChange, onSizeChange) => {
            const overlay = document.createElement('div');
            overlay.style = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                z-index: 9999;
                background: rgba(20, 20, 20, 0.9);
                border: 1px solid rgba(16, 185, 129, 0.4);
                padding: 12px;
                border-radius: 6px;
                color: #fff;
                font-family: sans-serif;
                font-size: 12px;
                box-shadow: 0 -4px 10px rgba(0,0,0,0.4);
                backdrop-filter: blur(4px);
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 180px;
            `;
            overlay.innerHTML = `
                <div style="font-weight: bold; color: #10b981; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(16, 185, 129, 0.2); padding-bottom: 4px;">
                    <span>Fabonymous F1</span>
                    <span id="f1-timer-display">--s</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; justify-content: space-between; color: #ccc; font-size: 10px;">
                        <span>REFRESH</span> <span id="f1-delay-value">${currentDelay}s</span>
                    </div>
                    <input type="range" id="f1-delay-slider" min="15" max="60" value="${currentDelay}" style="cursor: pointer; accent-color: #10b981; width: 100%;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; justify-content: space-between; color: #ccc; font-size: 10px;">
                        <span>MAX SIZE</span> <span id="f1-size-value">${currentMaxSize} Go</span>
                    </div>
                    <input type="range" id="f1-size-slider" min="0.1" max="100" step="0.1" value="${currentMaxSize}" style="cursor: pointer; accent-color: #10b981; width: 100%;">
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #aaa; margin-top: 2px;">
                    <input type="checkbox" id="f1-reset-size" style="cursor: pointer; accent-color: #10b981;">
                    <label for="f1-reset-size" style="cursor: pointer; user-select: none;">Reset to 10 Go</label>
                </div>
            `;
            document.body.appendChild(overlay);
            const delaySlider = document.getElementById('f1-delay-slider');
            const delayDisplay = document.getElementById('f1-delay-value');
            const sizeSlider = document.getElementById('f1-size-slider');
            const sizeDisplay = document.getElementById('f1-size-value');
            const resetCheckbox = document.getElementById('f1-reset-size');
            delaySlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                delayDisplay.innerText = `${val}s`;
                onDelayChange(val);
            });
            sizeSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                sizeDisplay.innerText = `${val} Go`;
                onSizeChange(val);
                if (val !== 10) resetCheckbox.checked = false;
            });
            resetCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    sizeSlider.value = 10;
                    sizeDisplay.innerText = `10 Go`;
                    onSizeChange(10);
                }
            });
            if (currentMaxSize === 10) resetCheckbox.checked = true;
        }
    };
    console.log(`Fabonymous ${fabonymous.version} loaded.`);
    let currentDelay = GM_getValue('refreshDelay', 60);
    let currentMaxSize = GM_getValue('maxTorrentSize', 10);
    let sec = currentDelay;
    let refreshTimeout = null;
    let countdownInterval = null;
    function startTimers() {
        if (refreshTimeout) clearTimeout(refreshTimeout);
        if (countdownInterval) clearInterval(countdownInterval);
        refreshTimeout = setTimeout(() => { window.location.reload(); }, sec * 1000);
        countdownInterval = setInterval(() => {
            sec--;
            document.title = `Fabonymous | ${sec}`;
            const timerDisplay = document.getElementById('f1-timer-display');
            if (timerDisplay) timerDisplay.innerText = `${sec}s`;
            if (sec < 0) { window.location.reload(); }
        }, 1000);
    }
    let w8t = setInterval(() => {
        if(document.querySelector("header") !== null) {
            clearInterval(w8t);
            setTimeout(() => {
                fabonymous.run();
                fabonymous.initOverlay(currentDelay, currentMaxSize,
                    (newDelay) => {
                        GM_setValue('refreshDelay', newDelay);
                        if (sec > newDelay) {
                            sec = newDelay;
                        }
                        clearTimeout(refreshTimeout);
                        refreshTimeout = setTimeout(() => { window.location.reload(); }, sec * 1000);
                    },
                    (newSize) => {
                        GM_setValue('maxTorrentSize', newSize);
                    }
                );
                startTimers();
            }, 100);
        }
    }, 100);
})();
