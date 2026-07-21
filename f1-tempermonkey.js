// ==UserScript==
// @name         C411 overlay F1
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  C411 overlay F1
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

    const CONFIG = {
        DEFAULT_REFRESH_DELAY_SEC: 60,
        DEFAULT_MAX_SIZE_GB: 10,
        ALERT_API_URL: 'http://localhost:3411/alert?name='
    };

    const FabonymousApp = {
        version: '0.7',

        triggerLocalAlert: (torrentTitle) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `${CONFIG.ALERT_API_URL}${encodeURIComponent(torrentTitle)}`
            });
        },

        parseSizeInGigabytes: (sizeText) => {
            const cleanedText = sizeText.trim();
            
            if (cleanedText.includes('To')) { return parseFloat(cleanedText.replace(' To', '')) * 1000; }
            if (cleanedText.includes('Go')) { return parseFloat(cleanedText.replace(' Go', '')); }
            if (cleanedText.includes('Mo')) { return parseFloat(cleanedText.replace(' Mo', '')) / 1000; }
            
            return 0;
        },

        highlightRecentTorrent: (torrentTimeEl, torrentSizeEl, torrentNameEl, minutesAgo, isFirstTorrent) => {
            let color = '';
            let fontSizeClass = 'text-xl';
            let blinkIntervalMs = 0;

            if (minutesAgo <= 3) {
                color = 'white';
                blinkIntervalMs = 300;
                if (isFirstTorrent) { FabonymousApp.triggerLocalAlert(torrentNameEl.innerHTML); }
            } else if (minutesAgo <= 5) {
                color = 'lightgreen';
                blinkIntervalMs = 500;
            } else if (minutesAgo <= 9) {
                color = 'yellow';
                blinkIntervalMs = 900;
            } else if (minutesAgo <= 15) {
                color = 'orange';
                fontSizeClass = 'text-l';
            }

            if (!color) { return; }

            if (minutesAgo <= 3) { torrentNameEl.style.color = 'white'; }

            [torrentTimeEl, torrentSizeEl].forEach(element => {
                element.classList.replace('text-xs', fontSizeClass);
                element.classList.remove('text-muted');
                element.style.color = color;
            });

            if (blinkIntervalMs > 0) {
                setInterval(() => {
                    const isHidden = torrentTimeEl.style.visibility === 'hidden';
                    torrentTimeEl.style.visibility = isHidden ? '' : 'hidden';
                    torrentSizeEl.style.visibility = isHidden ? '' : 'hidden';
                }, blinkIntervalMs);
            }
        },

        processTorrentList: () => {
            console.log('Fabonymous running...');
            
            const headerElement = document.querySelector("header");
            if (headerElement) { headerElement.style.display = 'none'; }

            const containerDivs = document.querySelector('main')?.querySelectorAll('div') || [];
            let targetScrollPosition = 0;
            let isFirstDetectedTorrent = true;
            const maxSizeAllowedGb = parseFloat(GM_getValue('maxTorrentSize', CONFIG.DEFAULT_MAX_SIZE_GB));

            containerDivs.forEach(container => {
                if (container.classList.contains('dark:divide-emerald-800/30') && !container.classList.contains('relative')) {
                    const torrentRows = container.querySelectorAll(':scope > div');
                    if (torrentRows.length === 0) { return; }

                    targetScrollPosition = torrentRows[0].getBoundingClientRect().top + window.scrollY;

                    torrentRows.forEach(torrentRow => {
                        const rowColumns = torrentRow.children[0]?.children;
                        if (!rowColumns || rowColumns.length < 8) { return; }

                        const torrentNameEl = rowColumns[1].children[0].children[0];
                        const torrentTimeEl = rowColumns[3];
                        const torrentSizeEl = rowColumns[4];

                        const torrentSizeGb = FabonymousApp.parseSizeInGigabytes(torrentSizeEl.innerText);
                        const isExceedingSizeLimit = torrentSizeGb > maxSizeAllowedGb;

                        if (!isExceedingSizeLimit && torrentTimeEl.innerText.includes('min')) {
                            const minutesAgo = parseInt(torrentTimeEl.innerText.replace(' min', ''), 10);
                            
                            FabonymousApp.highlightRecentTorrent(
                                torrentTimeEl, 
                                torrentSizeEl, 
                                torrentNameEl, 
                                minutesAgo, 
                                isFirstDetectedTorrent
                            );

                            if (minutesAgo <= 3 && isFirstDetectedTorrent) { isFirstDetectedTorrent = false; }
                        }
                    });
                }
            });

            window.scrollTo(0, targetScrollPosition);
            console.log('Fabonymous done.');
        },

        initOverlay: (currentDelay, currentMaxSize, onDelayChange, onSizeChange) => {
            const overlayContainer = document.createElement('div');
            overlayContainer.style.cssText = `
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

            overlayContainer.innerHTML = `
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

            document.body.appendChild(overlayContainer);

            const delaySlider = document.getElementById('f1-delay-slider');
            const delayDisplay = document.getElementById('f1-delay-value');
            const sizeSlider = document.getElementById('f1-size-slider');
            const sizeDisplay = document.getElementById('f1-size-value');
            const resetCheckbox = document.getElementById('f1-reset-size');

            delaySlider.addEventListener('input', (e) => {
                const newDelay = parseInt(e.target.value, 10);
                delayDisplay.innerText = `${newDelay}s`;
                onDelayChange(newDelay);
            });

            sizeSlider.addEventListener('input', (e) => {
                const newSize = parseFloat(e.target.value);
                sizeDisplay.innerText = `${newSize} Go`;
                onSizeChange(newSize);
                if (newSize !== CONFIG.DEFAULT_MAX_SIZE_GB) { resetCheckbox.checked = false; }
            });

            resetCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    sizeSlider.value = CONFIG.DEFAULT_MAX_SIZE_GB;
                    sizeDisplay.innerText = `${CONFIG.DEFAULT_MAX_SIZE_GB} Go`;
                    onSizeChange(CONFIG.DEFAULT_MAX_SIZE_GB);
                }
            });

            if (currentMaxSize === CONFIG.DEFAULT_MAX_SIZE_GB) { resetCheckbox.checked = true; }
        }
    };

    console.log(`Fabonymous ${FabonymousApp.version} loaded.`);

    const currentDelay = GM_getValue('refreshDelay', CONFIG.DEFAULT_REFRESH_DELAY_SEC);
    const currentMaxSize = GM_getValue('maxTorrentSize', CONFIG.DEFAULT_MAX_SIZE_GB);

    let secondsRemaining = currentDelay;
    let refreshTimeoutId = null;
    let countdownIntervalId = null;

    function setupAutoRefresh() {
        if (refreshTimeoutId) { clearTimeout(refreshTimeoutId); }
        if (countdownIntervalId) { clearInterval(countdownIntervalId); }

        refreshTimeoutId = setTimeout(() => { window.location.reload(); }, secondsRemaining * 1000);

        countdownIntervalId = setInterval(() => {
            secondsRemaining--;
            document.title = `Fabonymous | ${secondsRemaining}`;
            
            const timerDisplay = document.getElementById('f1-timer-display');
            if (timerDisplay) { timerDisplay.innerText = `${secondsRemaining}s`; }

            if (secondsRemaining < 0) { window.location.reload(); }
        }, 1000);
    }

    const waitForDomInterval = setInterval(() => {
        if (document.querySelector("header") !== null) {
            clearInterval(waitForDomInterval);

            setTimeout(() => {
                FabonymousApp.processTorrentList();

                FabonymousApp.initOverlay(
                    currentDelay, 
                    currentMaxSize,
                    (newDelay) => {
                        GM_setValue('refreshDelay', newDelay);
                        if (secondsRemaining > newDelay) { secondsRemaining = newDelay; }
                        clearTimeout(refreshTimeoutId);
                        refreshTimeoutId = setTimeout(() => { window.location.reload(); }, secondsRemaining * 1000);
                    },
                    (newMaxSize) => {
                        GM_setValue('maxTorrentSize', newMaxSize);
                    }
                );

                setupAutoRefresh();
            }, 100);
        }
    }, 100);

})();
