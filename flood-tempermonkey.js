// ==UserScript==
// @name         Flood - Tag Background Colorizer
// @namespace    http://tampermonkey.net/
// @version      0
// @description  uWu
// @author       Fabonymous
// @match        https://<domain>/flood/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const tagColors = {
        'film': 'rgba(230, 57, 70, 0.25)',
    'serie_tv': 'rgba(69, 123, 157, 0.25)',
    'f1': 'rgba(247, 127, 0, 0.25)',
    'sport': 'rgba(42, 157, 143, 0.25)',
    'documentaire': 'rgba(114, 9, 183, 0.25)',
    'spectacle': 'rgba(221, 161, 94, 0.25)',
    'iso': 'rgba(78, 205, 196, 0.25)',
    };
    function colorizeRows() {
        const rows = document.querySelectorAll('.torrent-table-row, tr, [role="row"]');

        rows.forEach(row => {
            if (row.querySelector('th')) return;
            const tagElement = row.querySelector('.tag, [class*="tag"], span[class*="Badge"]');
            if (tagElement) {
                const tagName = tagElement.textContent.trim().toLowerCase();
                if (tagColors[tagName]) {
                    row.style.backgroundColor = tagColors[tagName];
                }
            }
        });
    }
    const observer = new MutationObserver((mutations) => {
        let shouldRun = false;
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0 || mutation.target.classList.contains('torrent-table')) {
                shouldRun = true;
                break;
            }
        }
        if (shouldRun) {
            colorizeRows();
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    window.addEventListener('load', () => {
        setTimeout(colorizeRows, 1500);
    
})();
