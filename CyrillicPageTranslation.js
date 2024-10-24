// ==UserScript==
// @name         Cyrillic Page Transliteration
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Transliterate English characters into Cyrillic in real-time and across page content without affecting page structure or styles
// @author       Comrade_Aleks
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Extended mapping including multi-character sequences
    const multiCharMapping = {
        'shh': 'щ',
        'sh': 'ш',
        'ch': 'ч',
        'zh': 'ж',
        'ts': 'ц',
        'je': 'э', 'ä': 'э',
        'ju': 'ю', 'yu': 'ю', 'ü': 'ю',
        'ja': 'я', 'ya': 'я', 'q': 'я',
        'jo': 'ё', 'yo': 'ё', 'ö': 'ё'
    };

    const singleCharMapping = {
        'a': 'а', 'b': 'б', 'c': 'с', 'd': 'д', 'e': 'е', 'f': 'ф', 'g': 'г',
        'h': 'х', 'x': 'х', // Both 'h' and 'x' → 'х'
        'i': 'и', 'j': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н',
        'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у',
        'v': 'в', 'w': 'в', // Both 'v' and 'w' → 'в'
        'y': 'ы', 'z': 'з',
        'æ': 'э', 'ø': 'ё', 'å': 'о', // Norwegian letters
        "'": 'ь', // Special mapping for the quotation mark
    };

    // Function to transliterate text considering multi-character sequences
    function transliterateRecentInput(value, startIndex) {
        // Look back at the last few characters from startIndex
        const maxLookBack = 3; // Max length of multi-character sequences
        const buffer = value.slice(Math.max(0, startIndex - maxLookBack), startIndex).toLowerCase();

        // Check for the longest possible match
        for (let len = 3; len > 0; len--) {
            const segment = buffer.slice(-len);
            if (multiCharMapping[segment]) {
                return {
                    replacement: multiCharMapping[segment],
                    length: len
                };
            }
        }
        // Fallback to single character
        const lastChar = value[startIndex - 1].toLowerCase();
        return {
            replacement: singleCharMapping[lastChar] || value[startIndex - 1],
            length: 1
        };
    }

    // Function to handle real-time input transliteration with multi-character support
    function handleRealTimeInput(event) {
        const inputElement = event.target;
        const cursorPosition = inputElement.selectionStart;

        // If cursor position is at the start, nothing to do
        if (cursorPosition === 0) return;

        // Transliterate the last typed character or sequence
        const { replacement, length } = transliterateRecentInput(inputElement.value, cursorPosition);

        // Replace the last typed characters with the Cyrillic equivalent
        const newValue = inputElement.value.slice(0, cursorPosition - length) + replacement + inputElement.value.slice(cursorPosition);

        // Update input value while preserving cursor position
        inputElement.value = newValue;
        const newCursorPosition = cursorPosition - length + replacement.length;
        inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    // Attach listeners to input and textarea elements for real-time transliteration
    function attachInputListeners() {
        document.querySelectorAll('input[type="text"], textarea').forEach(input => {
            input.addEventListener('input', handleRealTimeInput);
        });
    }

    // Process the main page content
    processTextNodes(document.body);

    // Attach real-time listeners to existing input fields
    attachInputListeners();

    // Function to process only text nodes
    function processTextNodes(node) {
        if (node.nodeType === 3) { // Text node
            node.nodeValue = transliterateText(node.nodeValue);
        } else if (node.nodeType === 1 && node.childNodes) { // Element node
            node.childNodes.forEach(processTextNodes);
        }
    }

    // Transliterate entire text content (non-input fields)
    function transliterateText(text) {
        let result = '';
        let i = 0;

        while (i < text.length) {
            // Check for multi-character mapping first
            let threeChar = text.substr(i, 3).toLowerCase();
            let twoChar = text.substr(i, 2).toLowerCase();
            if (multiCharMapping[threeChar]) {
                result += multiCharMapping[threeChar];
                i += 3; // Skip three characters
            } else if (multiCharMapping[twoChar]) {
                result += multiCharMapping[twoChar];
                i += 2; // Skip two characters
            } else {
                // Fall back to single-character mapping
                let singleChar = text[i].toLowerCase();
                result += singleCharMapping[singleChar] || text[i];
                i++;
            }
        }
        return result;
    }

    // MutationObserver to track dynamic changes and transliterate new content
    function observePageChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 3) { // Text node
                            node.nodeValue = transliterateText(node.nodeValue);
                        } else if (node.nodeType === 1) { // Element node
                            processTextNodes(node); // Process any new elements

                            // If it's a new input or textarea, attach listeners
                            if (node.matches('input[type="text"], textarea')) {
                                node.addEventListener('input', handleRealTimeInput);
                            }

                            // Also check child elements for input or textarea fields
                            node.querySelectorAll('input[type="text"], textarea').forEach(input => {
                                input.addEventListener('input', handleRealTimeInput);
                            });
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start observing for dynamic content changes
    observePageChanges();
})();
