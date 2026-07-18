// ==UserScript==
// @name         C411 overlay F1
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  my C411 overlay
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

    const style = document.createElement('style');
    style.textContent = `
        @keyframes f1-blink { 50% { opacity: 0; } }
        .f1-blink-300 { animation: f1-blink 0.3s step-start infinite; }
        .f1-blink-500 { animation: f1-blink 0.5s step-start infinite; }
        .f1-blink-900 { animation: f1-blink 0.9s step-start infinite; }
    `;
    document.head.appendChild(style);

    const UNIT_MULTIPLIERS = Object.freeze({ 'Go': 1, 'To': 1000, 'Mo': 0.001 });
    const SIZE_REGEX = /([\d.]+)\s*(Go|To|Mo)/;

    const fabonymous = {
        version: '0.5',

        alert: (name) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `http://localhost:3411/alert?name=${encodeURIComponent(name)}`
            });
        },

        run: () => {
            console.log('Fabonymous running...');

            const header = document.querySelector("header");
            if (header) header.style.display = 'none';

            const main = document.querySelector('main');
            if (!main) return;

            const torrentContainer = main.querySelector('.dark\\:divide-emerald-800\\/30:not(.relative)');
            if (!torrentContainer) return;

            const torrentList = torrentContainer.querySelectorAll(':scope > div');
            if (torrentList.length === 0) return;

            const firstRow = torrentList[0].querySelector('a, div') || torrentList[0];
            const pixelToScroll = firstRow.getBoundingClientRect().top + window.scrollY;

            let firstorrent = true;
            const maxSizeAllowed = parseFloat(GM_getValue('maxTorrentSize', 10));

            torrentList.forEach(torrent => {
                const line = torrent.children[0];
                if (!line || line.children.length < 5) return;

                const torrentName = line.querySelector('a[href*="/torrent/"], div.truncate');

                let torrentTime = null, torrentSize = null;
                for (let i = 0; i < line.children.length; i++) {
                    const txt = line.children[i].innerText;
                    if (!torrentTime && (txt.includes('min') || txt.includes('h') || txt.includes('j'))) {
                        torrentTime = line.children[i];
                    } else if (!torrentSize && SIZE_REGEX.test(txt)) {
                        torrentSize = line.children[i];
                    }
                    if (torrentTime && torrentSize) break;
                }

                if (!torrentName || !torrentTime || !torrentSize) return;

                let skip2big = false;
                const match = torrentSize.innerText.match(SIZE_REGEX);
                if (match) {
                    const value = parseFloat(match[1]);
                    const unit = match[2];
                    if ((value * UNIT_MULTIPLIERS[unit]) > maxSizeAllowed) skip2big = true;
                }

                if (!skip2big && torrentTime.innerText.includes('min')) {
                    const sinceMin = parseInt(torrentTime.innerText.replace(' min', ''), 10);

                    let color = '';
                    let blinkClass = '';
                    let isCritical = false;

                    if (sinceMin <= 3) {
                        color = 'white';
                        blinkClass = 'f1-blink-300';
                        isCritical = true;
                        if (firstorrent) {
                            firstorrent = false;
                            fabonymous.alert(torrentName.textContent.trim());
                        }
                    } else if (sinceMin <= 5) {
                        color = 'lightgreen';
                        blinkClass = 'f1-blink-500';
                    } else if (sinceMin <= 9) {
                        color = 'yellow';
                        blinkClass = 'f1-blink-900';
                    } else if (sinceMin <= 15) {
                        color = 'orange';
                    }

                    if (color) {
                        const sizeClass = sinceMin <= 9 ? 'text-xl' : 'text-l';
                        if (isCritical) torrentName.style.color = 'white';

                        [torrentTime, torrentSize].forEach(el => {
                            el.classList.replace('text-xs', sizeClass);
                            el.classList.remove('text-muted');
                            el.style.color = color;
                            if (blinkClass) el.classList.add(blinkClass);
                        });
                    }
                }
            });

            setTimeout(() => {
                window.scrollTo({
                    top: pixelToScroll,
                    behavior: 'instant'
                });
                console.log('Scroll executed to:', pixelToScroll);
            }, 50);

            console.log('Fabonymous done.');
        },

        initOverlay: (currentDelay, currentMaxSize, onDelayChange, onSizeChange) => {
            const overlay = document.createElement('div');
            overlay.style = `
                position: fixed; bottom: 10px; left: 10px; z-index: 9999;
                background: rgba(20, 20, 20, 0.9); border: 1px solid rgba(16, 185, 129, 0.4);
                padding: 12px; border-radius: 6px; color: #fff; font-family: sans-serif;
                font-size: 12px; box-shadow: 0 -4px 10px rgba(0,0,0,0.4); backdrop-filter: blur(4px);
                display: flex; flex-direction: column; gap: 8px; min-width: 180px;
            `;

            overlay.innerHTML = `
                <div style="font-weight: bold; color: #10b981; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(16, 185, 129, 0.2); padding-bottom: 4px;">
                    <span>Fabonymous F1</span> <span id="f1-timer-display">--s</span>
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
                const val = parseInt(e.target.value, 10);
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
            const timerDisplay = document.getElementById('f1-timer-display');
            if (timerDisplay) timerDisplay.innerText = `${sec}s`;
            if (sec <= 0) { window.location.reload(); }
        }, 1000);
    }

    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector('.dark\\:divide-emerald-800\\/30:not(.relative)') !== null) {
            obs.disconnect();
            fabonymous.run();
            fabonymous.initOverlay(currentDelay, currentMaxSize,
                (newDelay) => {
                    GM_setValue('refreshDelay', newDelay);
                    if (sec > newDelay) sec = newDelay;
                    startTimers();
                },
                (newSize) => { GM_setValue('maxTorrentSize', newSize); }
            );
            startTimers();
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
