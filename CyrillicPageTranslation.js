// ==UserScript==
// @name         Cyrillic Page Transliteration for All Sites
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Transliterate all English text to Cyrillic on any webpage, focusing on visible elements and performance.
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const multiCharMapping = {
        'ye': 'е', 
        'je': 'е', 
        'yo': 'ё', 
        'jo': 'ё', 
        'zh': 'ж',
        'kh': 'х', 
        'ts': 'ц', 
        'ch': 'ч', 
        'sh': 'ш', 
        'shh': 'щ', 
        'shc': 'щ', 
        'sch': 'щ', 
        'yu': 'ю',
        'ju': 'ю',
        'ya': 'я',
        'ja': 'я',
        'ia': 'ия',


    };

    const singleCharMapping = {
        'a': 'а', 
        'b': 'б', 
        'c': 'ц', 
        'd': 'д', 
        'e': 'э', 
        'f': 'ф', 
        'g': 'г',
        'h': 'х', 
        'i': 'и', 
        'j': 'й', 
        'k': 'к', 
        'l': 'л', 
        'm': 'м',
        'n': 'н', 
        'o': 'о', 
        'p': 'п', 
        'q': 'ку', 
        'r': 'р', 
        's': 'с', 
        't': 'т', 
        'u': 'у', 
        'v': 'в', 
        'w': 'в', 
        'x': 'кс', 
        'y': 'ы', 
        "z": 'з',
        'æ': 'э', 
        'ø': 'ё', 
        'ö': 'ё',
        'å': 'о',
        "'": 'ь',
        '"': 'ъ',
        'è': 'э'
    }


    function transliterateText(text) {
        let result = '';
        let i = 0;
        while (i < text.length) {
            let threeChar = text.substr(i, 3).toLowerCase();
            let twoChar = text.substr(i, 2).toLowerCase();
            if (multiCharMapping[threeChar]) {
                result += multiCharMapping[threeChar];
                i += 3;
            } else if (multiCharMapping[twoChar]) {
                result += multiCharMapping[twoChar];
                i += 2;
            } else {
                let singleChar = text[i].toLowerCase();
                result += singleCharMapping[singleChar] || text[i];
                i++;
            }
        }
        return result;
    }

    function processTextNode(node) {
        if (node.nodeType === 3 && node.nodeValue.trim()) { // Text node with content
            node.nodeValue = transliterateText(node.nodeValue);
        }
    }

    function processElement(element) {
        // Skip elements that are input, textarea, or script/style tags
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes(element.tagName)) return;

        // Handle placeholders and other attributes
        if (element.hasAttribute('placeholder')) {
            element.setAttribute('placeholder', transliterateText(element.getAttribute('placeholder')));
        }
        if (element.hasAttribute('title')) {
            element.setAttribute('title', transliterateText(element.getAttribute('title')));
        }
        
        // Process text inside elements
        element.childNodes.forEach((node) => {
            if (node.nodeType === 3) {
                processTextNode(node);
            } else if (node.nodeType === 1) {
                processElement(node);
            }
        });
    }

    function transliterateAllTextNodes() {
        // Select main body content
        processElement(document.body);

        // Handle input and textarea fields
        const inputs = document.querySelectorAll('input[placeholder], textarea');
        inputs.forEach(input => {
            if (input.type !== 'password') {
                input.value = transliterateText(input.value);
            }
        });
    }

    // Efficiently observe only visible content changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    processElement(node);
                } else if (node.nodeType === 3) {
                    processTextNode(node);
                }
            });
        });
    });

    // Only observe the document's body to avoid infinite loops and unnecessary updates
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: true
    });

    // Initial run on page load
    if (document.readyState === 'complete') {
        transliterateAllTextNodes();
    } else {
        window.addEventListener('load', transliterateAllTextNodes);
    }
})();
