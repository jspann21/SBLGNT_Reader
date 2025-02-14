// script.js
/**
 * @typedef {Object} WordInfo
 * @property {string[]} word_forms - The different forms of the word.
 * @property {number} mounce_chapter - The Mounce chapter number.
 * @property {string} book_chapter_verse - The book, chapter, and verse reference.
 * @property {string} [gloss] - The gloss of the word.
 * @property {string} [literal] - The literal meaning.
 * @property {string} [louw] - The Louw-Nida reference.
 * @property {string} [strong] - The Strong's number.
 * @property {string} [pos_tag] - The part of speech tag.
 */

/**
 * @typedef {WordInfo[]} VerseWords
 */

// Global Variables
let sblgntData = {}; // Current book's data
let mounceVocab = {}; // Mounce vocab data
let booksList = []; // List of books
let currentBookIndex = 0; // Index in booksList
let currentChapter = 1; // Current chapter
let mounceChapterSelected = 99; // Default: No unbolding
let isLoading = false; // Flag to prevent multiple loads
let verseFontSizeScale = 3; // Default font size scale for verses (1 to 5)
let isParagraphMode = false; // Default: single-line mode
let showVerseNumbers = true; // Default: Show verse numbers
let lastTouch = null; // Global variable for tracking touch info for delegated events

// DOM Elements
const content = document.getElementById('content');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeButton = document.querySelector('.close-button');
const mounceSelect = document.getElementById('mounce-chapter');
const themeToggle = document.getElementById('theme-toggle');
const saveSettingsButton = document.getElementById('save-settings-button');
const paragraphsCache = {};
const bookDataCache = {};

// Side Navigation Elements
const sideNav = document.getElementById('side-nav');
const bookListElement = document.querySelector('.book-list');
const hamburgerButton = document.getElementById('hamburger-button');

// Navigation Buttons
const prevChapterButton = document.getElementById('prev-chapter');
const nextChapterButton = document.getElementById('next-chapter');

// Mapping of English book names to Greek book names for display
const bookNameMapping = {
    "Matthew": "ΚΑΤΑ ΜΑΘΘΑΙΟΝ",
    "Mark": "ΚΑΤΑ ΜΑΡΚΟΝ",
    "Luke": "ΚΑΤΑ ΛΟΥΚΑΝ",
    "John": "ΚΑΤΑ ΙΩΑΝΝΗΝ",
    "Acts": "ΠΡΑΞΕΙΣ ΑΠΟΣΤΟΛΩΝ",
    "Romans": "ΠΡΟΣ ΡΩΜΑΙΟΥΣ",
    "1Corinthians": "ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Α",
    "2Corinthians": "ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Β",
    "Galatians": "ΠΡΟΣ ΓΑΛΑΤΑΣ",
    "Ephesians": "ΠΡΟΣ ΕΦΕΣΙΟΥΣ",
    "Philippians": "ΠΡΟΣ ΦΙΛΙΠΠΗΣΙΟΥΣ",
    "Colossians": "ΠΡΟΣ ΚΟΛΟΣΣΑΕΙΣ",
    "1Thessalonians": "ΠΡΟΣ ΘΕΣΣΑΛΟΝΙΚΕΙΣ Α",
    "2Thessalonians": "ΠΡΟΣ ΘΕΣΣΑΛΟΝΙΚΕΙΣ Β",
    "1Timothy": "ΠΡΟΣ ΤΙΜΟΘΕΟΝ Α",
    "2Timothy": "ΠΡΟΣ ΤΙΜΟΘΕΟΝ Β",
    "Titus": "ΠΡΟΣ ΤΙΤΟΝ",
    "Philemon": "ΠΡΟΣ ΦΙΛΗΜΟΝΑ",
    "Hebrews": "ΠΡΟΣ ΕΒΡΑΙΟΥΣ",
    "James": "ΙΑΚΩΒΟΥ",
    "1Peter": "ΠΕΤΡΟΥ Α",
    "2Peter": "ΠΕΤΡΟΥ Β",
    "1John": "ΙΩΑΝΝΟΥ Α",
    "2John": "ΙΩΑΝΝΟΥ Β",
    "3John": "ΙΩΑΝΝΟΥ Γ",
    "Jude": "ΙΟΥΔΑ",
    "Revelation": "ΑΠΟΚΑΛΥΨΙΣ ΙΩΑΝΝΟΥ"
};

// Create Tooltip Element
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.classList.add('tooltip');
document.body.appendChild(tooltip);

// Cache the tooltip element in a variable for later use.
const tooltipElement = document.getElementById('tooltip');

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    await fetchData(); // Load initial data
    setupEventListeners(); // Set up event listeners for UI elements
    await loadBookData(currentBookIndex); // Load book data for current book
    const maxChap = getMaxChapter(currentBookIndex);
    populateChaptersInBook(currentBookIndex, maxChap);
    highlightSelectedBook();
    await displayChapter(currentBookIndex, currentChapter, true); // Load the saved chapter
});

// Load Settings from Local Storage
function loadSettings() {
    const storedMounce = localStorage.getItem('mounceChapter');
    const storedTheme = localStorage.getItem('theme');
    const storedVerseFontSizeScale = localStorage.getItem('verseFontSizeScale');
    const storedParagraphMode = localStorage.getItem('paragraphMode');
    const storedShowVerseNumbers = localStorage.getItem('showVerseNumbers');
    const storedBookIndex = localStorage.getItem('currentBookIndex');
    const storedChapter = localStorage.getItem('currentChapter');
    const storedTooltips = localStorage.getItem('enableTooltips');
    const storedUnboldProper = localStorage.getItem('unboldProperNouns');

    if (storedBookIndex !== null && storedChapter !== null) {
        currentBookIndex = parseInt(storedBookIndex, 10);
        currentChapter = parseInt(storedChapter, 10);
    }

    if (storedMounce) {
        mounceChapterSelected = parseInt(storedMounce, 10);
    }

    if (storedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.checked = true;
    }

    if (storedVerseFontSizeScale) {
        verseFontSizeScale = parseInt(storedVerseFontSizeScale, 10);
        updateVerseFontSize(verseFontSizeScale);
        document.getElementById('font-size-slider').value = verseFontSizeScale;
    }

    if (storedParagraphMode) {
        isParagraphMode = storedParagraphMode === 'true';
        document.getElementById('paragraph-toggle').checked = isParagraphMode;
    }

    if (storedShowVerseNumbers) {
        showVerseNumbers = storedShowVerseNumbers === 'true';
        document.getElementById('show-verse-numbers').checked = showVerseNumbers;
    }

    // Load the tooltip setting (default: true if not set)
    const enableTooltips = storedTooltips === null ? true : storedTooltips === 'true';
    document.getElementById('tooltip-toggle').checked = enableTooltips;
    window.enableTooltips = enableTooltips;

    // Load the 'Unbold Proper Nouns' setting (default: false)
    const unboldProper = storedUnboldProper === 'true';
    document.getElementById('unbold-proper-toggle').checked = unboldProper;
    window.unboldProperNouns = unboldProper;
}


// Save Settings to Local Storage
function saveSettings() {
    localStorage.setItem('mounceChapter', mounceChapterSelected);
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    localStorage.setItem('verseFontSizeScale', verseFontSizeScale);
    localStorage.setItem('paragraphMode', isParagraphMode);
    localStorage.setItem('showVerseNumbers', showVerseNumbers);
    localStorage.setItem('currentBookIndex', currentBookIndex);
    localStorage.setItem('currentChapter', currentChapter);
    localStorage.setItem('unboldProperNouns', document.getElementById('unbold-proper-toggle').checked);

    // Save tooltip setting
    const enableTooltips = document.getElementById('tooltip-toggle').checked;
    localStorage.setItem('enableTooltips', enableTooltips);
    window.enableTooltips = enableTooltips;
}


function updateVerseFontSize(scale) {
    const fontSizeMap = {
        1: '16px', // Small
        2: '18px', // Smaller
        3: '20px', // Medium (default)
        4: '24px', // Large
        5: '36px'  // Larger
    };
    document.documentElement.style.setProperty('--verse-font-size', fontSizeMap[scale]);
}

async function fetchData() {
    try {
        // Fetch mounce_vocab.json and books.json concurrently
        const [mounceResponse, booksResponse] = await Promise.all([
            fetch('mounce_vocab.json'),
            fetch('sblgnt_json/books.json')
        ]);

        if (!mounceResponse.ok) {
            console.error(`Failed to fetch mounce_vocab.json: ${mounceResponse.statusText}`);
            return;
        }
        mounceVocab = await mounceResponse.json();
        populateMounceSelect();

        if (!booksResponse.ok) {
            console.error(`Failed to fetch books.json: ${booksResponse.statusText}`);
            return;
        }
        booksList = await booksResponse.json();

        // Build the side navigation list using the Greek names if available.
        booksList.forEach((book, index) => {
            const bookItem = document.createElement('li');
            bookItem.classList.add('book-item');
            bookItem.dataset.index = String(index);

            const bookTitle = document.createElement('div');
            bookTitle.classList.add('book-title');
            // Use the Greek name mapping if available
            bookTitle.textContent = bookNameMapping[book] || book;
            bookItem.appendChild(bookTitle);

            // Create a chapter grid for the accordion
            const chaptersDiv = document.createElement('div');
            chaptersDiv.classList.add('chapter-grid', 'hidden');
            bookItem.appendChild(chaptersDiv);

            bookListElement.appendChild(bookItem);
        });

        // Set default book (using "Matthew" if available)
        const defaultBookIdx = booksList.indexOf("Matthew");
        currentBookIndex = defaultBookIdx !== -1 ? defaultBookIdx : 0;

        highlightSelectedBook();
        await loadBookData(currentBookIndex);
        const maxChap = getMaxChapter(currentBookIndex);
        populateChaptersInBook(currentBookIndex, maxChap);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Populate Chapters within a Specific Book's Chapter Grid
function populateChaptersInBook(bookIdx, maxChap) {
    const bookItem = document.querySelector(`.book-item[data-index="${bookIdx}"]`);
    const chaptersDiv = bookItem.querySelector('.chapter-grid');
    chaptersDiv.innerHTML = ''; // Clear existing chapters

    const columns = 5;
    chaptersDiv.style.display = 'grid';
    chaptersDiv.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    for (let chap = 1; chap <= maxChap; chap++) {
        const chapterButton = document.createElement('button');
        chapterButton.textContent = String(chap);
        chapterButton.classList.add('chapter-button');
        chapterButton.dataset.chapter = String(chap);
        chaptersDiv.appendChild(chapterButton);
    }
}

// Highlight the currently selected book in the side navigation
function highlightSelectedBook() {
    const bookItems = document.querySelectorAll('.book-item');
    bookItems.forEach(item => {
        if (parseInt(item.dataset.index, 10) === currentBookIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Function to Update Side Navigation When Current Book or Chapter Changes
function updateSideNav() {
    // Collapse all chapter grids and remove 'active' class from all book items
    const allBookItems = document.querySelectorAll('.book-item');
    allBookItems.forEach(item => {
        const grid = item.querySelector('.chapter-grid');
        if (grid) {
            grid.classList.add('hidden');
        }
        item.classList.remove('active');
    });

    // Expand the current book's chapters
    const currentBookItem = document.querySelector(`.book-item[data-index="${currentBookIndex}"]`);
    if (currentBookItem) {
        const chaptersDiv = currentBookItem.querySelector('.chapter-grid');

        // Populate chapters if not already populated
        if (chaptersDiv && chaptersDiv.children.length === 0) {
            const maxChap = getMaxChapter(currentBookIndex);
            populateChaptersInBook(currentBookIndex, maxChap);
        }

        chaptersDiv.classList.remove('hidden');
        currentBookItem.classList.add('active');
    }

    // Highlight the current chapter button
    updateChapterButtons();
}

async function loadBookData(bookIdx) {
    const bookName = booksList[bookIdx];
    const fileName = bookName.replace(/ /g, '');

    // Use cached data if available
    if (bookDataCache[bookName]) {
        sblgntData = bookDataCache[bookName];
        return;
    }

    try {
        const response = await fetch(`sblgnt_json/${fileName}.json`);
        if (!response.ok) {
            console.error(`Failed to fetch ${fileName}.json: ${response.statusText}`);
            return;
        }
        const data = await response.json();
        sblgntData = data[bookName];
        if (!sblgntData) {
            console.error(`Book data for ${bookName} not found in JSON.`);
            return;
        }
        // Cache the data for later use
        bookDataCache[bookName] = sblgntData;
    } catch (error) {
        console.error(`Error loading book ${bookName}:`, error);
        sblgntData = {};
    }
}



// Get Maximum Chapter for a Book
function getMaxChapter(bookIdx) {
    const bookName = booksList[bookIdx];
    const bookData = sblgntData;
    if (!bookData || Object.keys(bookData).length === 0) {
        console.warn(`Book data for ${bookName} is not loaded.`);
        return 1; // Default to 1 if not found
    }
    return Object.keys(bookData).length;
}

// Populate Mounce Chapter Dropdown
function populateMounceSelect() {
    mounceSelect.innerHTML = '<option value="99">None</option>';

    const mounceChapters = Object.keys(mounceVocab).map(chapterStr => parseInt(chapterStr, 10));
    const uniqueChapters = Array.from(new Set(mounceChapters)).sort((a, b) => a - b);

    uniqueChapters.forEach(chapterNum => {
        const option = document.createElement('option');
        option.value = String(chapterNum);
        option.textContent = String(chapterNum);
        mounceSelect.appendChild(option);
    });

    mounceSelect.value = mounceChapterSelected;
}

// Helper function to fetch and cache paragraph JSON data
async function getParagraphs(bookName, chapter) {
    const formattedChapter = String(chapter).padStart(3, '0');
    const cacheKey = `${bookName}-${formattedChapter}`;
    if (paragraphsCache[cacheKey]) {
        return paragraphsCache[cacheKey];
    }
    try {
        const response = await fetch(`sblgnt_json/paragraphs/${bookName}/${formattedChapter}-paragraphs.json`);
        if (!response.ok) {
            console.error(`Failed to fetch paragraphs for ${bookName} ${formattedChapter}: ${response.statusText}`);
            return null;
        }
        const paragraphs = await response.json();
        paragraphsCache[cacheKey] = paragraphs;
        return paragraphs;
    } catch (error) {
        console.error(`Error fetching paragraphs for ${bookName} ${formattedChapter}:`, error);
        return null;
    }
}

// Display a Specific Chapter
async function displayChapter(bookIdx, chapter, scrollToTop = true) {
    if (chapter < 1) return; // Prevent loading invalid chapters
    const bookName = booksList[bookIdx];
    const greekBookName = bookNameMapping[bookName] || bookName; // Use Greek name for display
    const chapterData = sblgntData[chapter];
    if (!chapterData) {
        console.warn(`No data found for ${bookName} Chapter ${chapter}`);
        return;
    }

    // Create chapter element
    const chapterElement = document.createElement('div');
    chapterElement.classList.add('chapter');
    chapterElement.id = `chapter-${bookIdx}-${chapter}`;

    // Add chapter title (use Greek name if available)
    const chapterTitle = document.createElement('h2');
    chapterTitle.textContent = `${greekBookName} ${chapter}`;
    chapterElement.appendChild(chapterTitle);

    if (isParagraphMode) {
        await renderParagraphMode(chapterElement, bookName, chapter, chapterData);
    } else {
        renderNonParagraphMode(chapterElement, chapterData, chapter); // Pass chapter here
    }

    // Replace current content with the new chapter
    content.innerHTML = ''; // Clear current content
    content.appendChild(chapterElement); // Append the entire chapterElement to content

    // Scroll to the top of the page after rendering the chapter
    if (scrollToTop) {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
    // Update navigation buttons' state
    updateNavigationButtons();
    updateChapterButtons();
}

async function renderParagraphMode(chapterElement, bookName, chapter, chapterData) {
    const paragraphs = await getParagraphs(bookName, chapter);
    if (!paragraphs) return;
    paragraphs.forEach(paragraph => {
        const paragraphElement = document.createElement('div');
        paragraphElement.classList.add('paragraph');
        paragraph.forEach(verseNum => {
            if (chapterData[verseNum]) {
                const verseElement = document.createElement('span');
                verseElement.classList.add('verse');
                addVerseContent(verseElement, chapterData[verseNum]);
                paragraphElement.appendChild(verseElement);
            }
        });
        chapterElement.appendChild(paragraphElement);
    });
}

function renderNonParagraphMode(chapterElement, chapterData, chapter) {
    const combinedVerses = {};
    Object.keys(chapterData).forEach(verseNum => {
        // Remove any trailing letter (e.g. for variants)
        const baseVerseNum = verseNum.replace(/[a-z]$/, '');
        if (!combinedVerses[baseVerseNum]) {
            combinedVerses[baseVerseNum] = [];
        }
        combinedVerses[baseVerseNum].push(...chapterData[verseNum]);
    });

    // Sort the keys numerically before rendering
    Object.keys(combinedVerses)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .forEach(verseNum => {
            const verseElement = document.createElement('div');
            verseElement.classList.add('verse');
            verseElement.id = `chapter-${chapter}-verse-${verseNum}`;
            addVerseContent(verseElement, combinedVerses[verseNum]);
            chapterElement.appendChild(verseElement);
        });
}


// Load Next Chapter
async function loadNextPassage() {
    if (isLoading) return;
    isLoading = true;

    const totalChapters = getMaxChapter(currentBookIndex);

    if (currentChapter < totalChapters) {
        currentChapter += 1;
    } else if (currentBookIndex < booksList.length - 1) {
        currentBookIndex += 1;
        currentChapter = 1;
        await loadBookData(currentBookIndex);
        highlightSelectedBook();
        const maxChap = getMaxChapter(currentBookIndex);
        populateChaptersInBook(currentBookIndex, maxChap);
    } else {
        // Reached the end of the Bible
        alert('You have reached the end of the Bible.');
        isLoading = false;
        return;
    }

    // Load and display the next chapter
    await displayChapter(currentBookIndex, currentChapter, true);

    // Update side navigation
    updateSideNav();
    isLoading = false;
}

// Load Previous Chapter
async function loadPreviousPassage() {
    if (isLoading) return;
    isLoading = true;

    if (currentChapter > 1) {
        currentChapter -= 1;
    } else if (currentBookIndex > 0) {
        currentBookIndex -= 1;
        await loadBookData(currentBookIndex);
        highlightSelectedBook();
        currentChapter = getMaxChapter(currentBookIndex);
        const maxChap = getMaxChapter(currentBookIndex);
        populateChaptersInBook(currentBookIndex, maxChap);
    } else {
        // Reached the beginning of the Bible
        alert('You are already at the beginning of the Bible.');
        isLoading = false;
        return;
    }

    // Load and display the previous chapter
    await displayChapter(currentBookIndex, currentChapter, true);

    // Update side navigation
    updateSideNav();
    isLoading = false;
}


// Determine if a Word Should Be Unbolded
function shouldUnbold(wordMounceChapter, wordType) {
    if (window.unboldProperNouns && wordType === 'proper') {
        return true; // Unbold proper nouns if setting is enabled
    }
    if (mounceChapterSelected === 99) return true; // No unbolding
    return wordMounceChapter <= mounceChapterSelected;
}

// Update Navigation Buttons' State
function updateNavigationButtons() {
    const totalChapters = getMaxChapter(currentBookIndex);

    // Disable Previous Button if at the first chapter of the first book
    prevChapterButton.disabled = currentBookIndex === 0 && currentChapter === 1;

    // Disable Next Button if at the last chapter of the last book
    nextChapterButton.disabled = currentBookIndex === booksList.length - 1 && currentChapter === totalChapters;
}

// Update Chapter Buttons' State in Side Navigation
function updateChapterButtons() {
    // Remove 'active' class from all chapter buttons
    const allChapterButtons = document.querySelectorAll('.chapter-button');
    allChapterButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Add 'active' class to the current chapter button
    const currentChapterButton = document.querySelector(`.book-item[data-index="${currentBookIndex}"] .chapter-button[data-chapter="${currentChapter}"]`);
    if (currentChapterButton) {
        currentChapterButton.classList.add('active');
    }
}

function ensureAccordionInView(bookItem) {
    const sideNav = document.getElementById('side-nav');
    const chaptersDiv = bookItem.querySelector('.chapter-grid');

    // Get the offset positions relative to the sideNav
    const sideNavRect = sideNav.getBoundingClientRect();
    const chaptersDivRect = chaptersDiv.getBoundingClientRect();

    // Calculate the top and bottom positions relative to the sideNav's scroll area
    const chaptersDivTop = chaptersDivRect.top - sideNavRect.top + sideNav.scrollTop;
    const chaptersDivBottom = chaptersDivRect.bottom - sideNavRect.top + sideNav.scrollTop;

    // Determine how much we need to scroll
    if (chaptersDivBottom > sideNav.scrollTop + sideNav.clientHeight) {
        // Chapters extend below the visible area
        sideNav.scrollTo({
            top: chaptersDivBottom - sideNav.clientHeight,
            behavior: 'smooth'
        });
    } else if (chaptersDivTop < sideNav.scrollTop) {
        // Chapters extend above the visible area
        sideNav.scrollTo({
            top: chaptersDivTop,
            behavior: 'smooth'
        });
    }
}

function addVerseContent(verseElement, verseWords) {
    if (showVerseNumbers) {
        const verseNumber = document.createElement('span');
        verseNumber.classList.add('verse-number');

        // Ensure the verse number is extracted correctly
        const verseNumStr = verseWords[0].book_chapter_verse;
        verseNumber.textContent = String(parseInt(verseNumStr.slice(-2), 10));
        verseElement.appendChild(verseNumber);
    }

    verseWords.forEach(wordInfo => {
        const wordSpan = document.createElement('span');
        // Use the first word form plus a trailing space.
        wordSpan.textContent = wordInfo.word_forms[0] + ' ';
        wordSpan.style.fontFamily = 'sbl_greek, serif';

        if (shouldUnbold(wordInfo.mounce_chapter, wordInfo.type)) {
            wordSpan.classList.add('unbold-word');
        } else {
            wordSpan.classList.add('bold-word');
        }

        // Store the wordInfo object as a JSON string in a data attribute.
        wordSpan.dataset.wordInfo = JSON.stringify(wordInfo);

        // No individual event listeners are attached here.
        verseElement.appendChild(wordSpan);
    });
}


function showTooltip(event, wordInfo) {
    if (!window.enableTooltips) {
        return; // Exit early if tooltips are disabled
    }

    const tooltip = tooltipElement;

    // Hide any existing tooltips before showing a new one
    tooltip.classList.remove('visible');

    // Extract necessary information from the wordInfo object
    const gloss = wordInfo.gloss || 'No gloss available';
    const literal = wordInfo.literal || 'No literal available';
    const louw = wordInfo.louw || 'N/A';
    const strong = wordInfo.strong || 'N/A';
    const mounce = wordInfo.mounce_chapter !== 99 ? `${wordInfo.mounce_chapter}` : 'N/A';
    const posTag = interpretPosTag(wordInfo.pos_tag); // Interpret the pos_tag

    // Build the tooltip content
    tooltip.innerHTML = `
        <div class="tooltip-header">
            <span class="tooltip-lemma"><strong>${wordInfo.word_forms[3]}</strong></span> <!-- Lemma -->
            <span class="tooltip-close"><button type="button" class="close-button">&times;</button></span>
        </div>
        <div class="tooltip-content">
            <div class="tooltip-gloss"><strong>Gloss:</strong> ${gloss}</div>
            <div class="tooltip-literal"><strong>Literal:</strong> ${literal}</div>
            <div class="tooltip-pos-tag"><strong>Part of Speech:</strong> ${posTag}</div>
            <div class="tooltip-louw"><strong>Louw-Nida:</strong> ${louw}</div>
            <div class="tooltip-strong"><strong>Strong's:</strong> ${strong}</div>
            <div class="tooltip-mounce"><strong>Mounce Chapter:</strong> ${mounce}</div>
        </div>
    `;

    const rect = event.target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Mobile handling: Fixed to the bottom of the screen
    if (viewportWidth <= 768) {
        // Mobile handling: Fixed to the bottom of the screen
        tooltip.style.position = 'fixed';
        tooltip.style.top = 'auto';
        tooltip.style.left = '0';
        tooltip.style.right = '0';
        tooltip.style.bottom = '0'; // Fixed at the bottom of the screen
        tooltip.style.width = '100%'; // Ensure full width on mobile
    } else {
        // Desktop handling: Position below or above based on available space
        tooltip.style.position = 'absolute';
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;

        // Ensure the tooltip is rendered before checking dimensions
        setTimeout(() => {
            const tooltipHeight = tooltip.offsetHeight;
            const tooltipWidth = tooltip.offsetWidth;

            const spaceBelowWord = viewportHeight - rect.bottom;
            // Check if the tooltip overflows the bottom of the viewport
            if (spaceBelowWord < tooltipHeight) {
                // If not enough space below, position above the word
                tooltip.style.top = `${rect.top + window.scrollY - tooltipHeight - 5}px`;
            }

            // Check if the tooltip overflows the right side of the viewport
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > viewportWidth) {
                // Shift it left to prevent overflow on the right side
                tooltip.style.left = `${viewportWidth - tooltipWidth - 20}px`; // Adjust to fit within the viewport
            }

            // Prevent tooltip from going off the left side of the viewport
            if (tooltipRect.left < 0) {
                tooltip.style.left = '10px'; // Adjust to stay within the viewport
            }

            // Prevent tooltip from going off the top of the viewport
            if (tooltipRect.top < 0) {
                tooltip.style.top = `10px`; // Adjust to stay within the viewport
            }
        }, 0); // Use a short timeout to allow rendering to complete
    }
    // After positioning, make the tooltip visible
    tooltip.classList.add('visible');
}

function hideTooltip(event) {
    if (event) {
        event.preventDefault();
    }
    const tooltip = tooltipElement;
    tooltip.classList.remove('visible');
    tooltip.innerHTML = '';
}

function interpretPosTag(posTag) {
    if (!posTag) return 'No POS data available';

    const partOfSpeech = posTag.charAt(0);
    const details = posTag.slice(1); // Extract the rest of the POS details

    let posDescription;
    let additionalInfo = '';

    switch (partOfSpeech) {
        case 'N': // Noun
            posDescription = 'Noun';
            additionalInfo = interpretCaseNumberGender(details);
            break;
        case 'V': // Verb
            posDescription = 'Verb';
            additionalInfo = interpretVerbDetails(details);
            break;
        case 'J': // Adjective
            posDescription = 'Adjective';
            additionalInfo = interpretAdjectiveDetails(details);
            break;
        case 'R': // Pronoun
            posDescription = 'Pronoun';
            additionalInfo = interpretPronounDetails(details);
            break;
        case 'D': // Definite article
            posDescription = 'Definite Article';
            additionalInfo = interpretCaseNumberGender(details);
            break;
        case 'C': // Conjunction
            posDescription = 'Conjunction';
            additionalInfo = interpretConjunctionDetails(details);
            break;
        case 'B': // Adverb
            posDescription = 'Adverb';
            additionalInfo = interpretAdverbDetails(details);
            break;
        case 'T': // Particle
            posDescription = 'Particle';
            additionalInfo = interpretParticleDetails(details);
            break;
        case 'P': // Preposition
            posDescription = 'Preposition';
            break;
        case 'I': // Interjection
            posDescription = 'Interjection';
            break;
        case 'X': // Indeclinable
            posDescription = 'Indeclinable';
            additionalInfo = interpretIndeclinableDetails(details);
            break;
        default:
            posDescription = 'Unknown Part of Speech';
    }

    return `${posDescription}${additionalInfo ? ' - ' + additionalInfo : ''}`;
}


function interpretCaseNumberGender(details) {
    const caseMap = {'N': 'Nominative', 'G': 'Genitive', 'D': 'Dative', 'A': 'Accusative', 'V': 'Vocative'};
    const numberMap = {'S': 'Singular', 'P': 'Plural', 'D': 'Dual'};
    const genderMap = {'M': 'Masculine', 'F': 'Feminine', 'N': 'Neuter'};

    const caseValue = caseMap[details.charAt(0)] || '';
    const numberValue = numberMap[details.charAt(1)] || '';
    const genderValue = genderMap[details.charAt(2)] || '';

    // Return the simplified output, removing empty values
    return [caseValue, numberValue, genderValue].filter(Boolean).join(', ');
}

function interpretAdjectiveDetails(details) {
    const caseNumberGender = interpretCaseNumberGender(details);
    const degreeMap = {'C': 'Comparative', 'S': 'Superlative', 'O': 'Other'};

    const degree = degreeMap[details.charAt(3)] || ''; // Degree is the optional 4th field

    return [caseNumberGender, degree].filter(Boolean).join(', ');
}

function interpretVerbDetails(details) {
    const tenseMap = {
        'P': 'Present',
        'I': 'Imperfect',
        'F': 'Future',
        'T': 'Future-perfect',
        'A': 'Aorist',
        'R': 'Perfect',
        'L': 'Pluperfect'
    };
    const voiceMap = {'A': 'Active', 'M': 'Middle', 'P': 'Passive', 'U': 'Middle-Passive'};
    const moodMap = {
        'I': 'Indicative',
        'S': 'Subjunctive',
        'O': 'Optative',
        'M': 'Imperative',
        'N': 'Infinitive',
        'P': 'Participle'
    };
    const personMap = {'1': '1st Person', '2': '2nd Person', '3': '3rd Person'};
    const numberMap = {'S': 'Singular', 'P': 'Plural', 'D': 'Dual'};

    const tense = tenseMap[details.charAt(0)] || '';
    const voice = voiceMap[details.charAt(1)] || '';
    const mood = moodMap[details.charAt(2)] || '';
    const person = personMap[details.charAt(3)] || '';
    const number = numberMap[details.charAt(4)] || '';

    // Some verbs (like participles) can have Case and Gender
    const caseNumberGender = details.length > 5 ? interpretCaseNumberGender(details.slice(5)) : '';

    // Return the simplified output, removing empty values
    return [tense, voice, mood, person, number, caseNumberGender].filter(Boolean).join(', ');
}

function interpretPronounDetails(details) {
    const pronounTypeMap = {
        'R': 'Relative', 'C': 'Reciprocal', 'D': 'Demonstrative', 'K': 'Correlative',
        'I': 'Interrogative', 'X': 'Indefinite', 'F': 'Reflexive', 'S': 'Possessive', 'P': 'Personal'
    };

    const pronounSubtypeMap = {'A': 'Intensive Attributive', 'P': 'Intensive Predicative'};

    const pronounType = pronounTypeMap[details.charAt(0)] || '';
    const person = details.charAt(1) !== '-' ? `${details.charAt(1)}rd Person` : ''; // Handle the dash (-) for no value
    const caseNumberGender = interpretCaseNumberGender(details.slice(2));
    const pronounSubtype = pronounSubtypeMap[details.charAt(5)] || ''; // Only applies to personal pronouns

    return [pronounType, person, caseNumberGender, pronounSubtype].filter(Boolean).join(', ');
}

function interpretConjunctionDetails(details) {
    const conjunctionTypeMap = {'L': 'Logical', 'A': 'Adverbial', 'S': 'Substantival'};

    const logicalSubtypeMap = {
        'A': 'Ascensive',
        'N': 'Connective',
        'C': 'Contrastive',
        'K': 'Correlative',
        'D': 'Disjunctive',
        'M': 'Emphatic',
        'X': 'Explanatory',
        'I': 'Inferential',
        'T': 'Transitional'
    };
    const adverbialSubtypeMap = {
        'Z': 'Causal',
        'M': 'Comparative',
        'N': 'Concessive',
        'C': 'Conditional',
        'D': 'Declarative',
        'L': 'Local',
        'P': 'Purpose',
        'R': 'Result',
        'T': 'Temporal'
    };
    const substantivalSubtypeMap = {'C': 'Content', 'E': 'Epexegetical'};

    const conjunctionType = conjunctionTypeMap[details.charAt(0)] || '';
    let conjunctionSubtype = '';

    if (conjunctionType === 'Logical') {
        conjunctionSubtype = logicalSubtypeMap[details.charAt(1)] || '';
    } else if (conjunctionType === 'Adverbial') {
        conjunctionSubtype = adverbialSubtypeMap[details.charAt(1)] || '';
    } else if (conjunctionType === 'Substantival') {
        conjunctionSubtype = substantivalSubtypeMap[details.charAt(1)] || '';
    }

    return [conjunctionType, conjunctionSubtype].filter(Boolean).join(', ');
}

function interpretAdverbDetails(details) {
    const adverbTypeMap = {
        'C': 'Conditional',
        'K': 'Correlative',
        'E': 'Emphatic',
        'X': 'Indefinite',
        'I': 'Interrogative',
        'N': 'Negative',
        'P': 'Place',
        'S': 'Superlative'
    };

    return adverbTypeMap[details.charAt(0)] || '';
}

function interpretParticleDetails(details) {
    return interpretAdverbDetails(details); // Particles share the same types as adverbs
}

function interpretIndeclinableDetails(details) {
    const indeclinableTypeMap = {'L': 'Letter', 'P': 'Proper Noun', 'N': 'Numeral', 'F': 'Foreign Word', 'O': 'Other'};

    return indeclinableTypeMap[details.charAt(0)] || '';
}

// Setup Event Listeners
function setupEventListeners() {
    // Settings Button Click
    settingsButton.addEventListener('click', () => {
        // Close side navigation if it's open
        if (sideNav.classList.contains('open')) {
            sideNav.classList.remove('open');
            document.body.classList.remove('no-scroll');
        }

        // Open the settings modal
        settingsModal.classList.remove('hidden');
    });

    // Close Button Click
    closeButton.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Click Outside Modal to Close
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('close-button')) {
            hideTooltip(event);
        }
    });

    window.addEventListener('scroll', () => {
        hideTooltip(); // Always hide tooltips when scrolling
    });

    // Save Settings Button Click
    saveSettingsButton.addEventListener('click', async () => {
        mounceChapterSelected = parseInt(mounceSelect.value, 10);
        saveSettings();
        settingsModal.classList.add('hidden');
        await displayChapter(currentBookIndex, currentChapter, false);
    });

    // Theme Toggle Change
    themeToggle.addEventListener('change', (event) => {
        if (event.target.checked) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        // Settings are saved when 'Save' button is clicked
    });

    // Hamburger Button Click (Toggle Side Navigation)
    hamburgerButton.addEventListener('click', () => {
        // Close settings modal if it's open
        if (!settingsModal.classList.contains('hidden')) {
            settingsModal.classList.add('hidden');
        }
        hideTooltip();

        // Toggle side navigation
        if (sideNav.classList.contains('open')) {
            sideNav.classList.remove('open');
            document.body.classList.remove('no-scroll');
        } else {
            sideNav.classList.add('open');
            document.body.classList.add('no-scroll');
        }
    });

    // Book Item Click - Toggle Chapter Grid and Load Book Data
    bookListElement.addEventListener('click', async (event) => {
        const bookTitle = event.target.closest('.book-title');
        const bookItem = event.target.closest('.book-item');
        if (bookTitle && bookItem) {
            const selectedBookIdx = parseInt(bookItem.dataset.index, 10);
            const chaptersDiv = bookItem.querySelector('.chapter-grid');

            if (currentBookIndex !== selectedBookIdx) {
                // A different book is selected

                // Collapse all chapter grids and remove 'active' class from all book items
                const allBookItems = document.querySelectorAll('.book-item');
                allBookItems.forEach(item => {
                    const grid = item.querySelector('.chapter-grid');
                    if (grid) {
                        grid.classList.add('hidden');
                    }
                    item.classList.remove('active');
                });

                // Set new active book
                currentBookIndex = selectedBookIdx;
                highlightSelectedBook();

                // Load book data
                await loadBookData(currentBookIndex);

                // Get max chapters and populate chapters
                const maxChap = getMaxChapter(currentBookIndex);
                populateChaptersInBook(currentBookIndex, maxChap);

                // Expand the selected book's chapters
                chaptersDiv.classList.remove('hidden');
                bookItem.classList.add('active');

                // Ensure the expanded accordion is fully visible within the side navigation
                ensureAccordionInView(bookItem);
            } else {
                // Same book is clicked, toggle the chapter grid
                chaptersDiv.classList.toggle('hidden');
                bookItem.classList.toggle('active');

                // Ensure the expanded or collapsed accordion is fully visible
                if (!chaptersDiv.classList.contains('hidden')) {
                    ensureAccordionInView(bookItem);
                }
            }
        }
    });

    // Chapter Button Click - Load Selected Chapter
    bookListElement.addEventListener('click', async (event) => {
        const chapterButton = event.target.closest('.chapter-button');
        if (chapterButton) {
            const selectedChapter = parseInt(chapterButton.dataset.chapter, 10);
            if (!isNaN(selectedChapter)) {
                currentChapter = selectedChapter;
                await displayChapter(currentBookIndex, currentChapter, true);
                updateChapterButtons(); // Highlight the current chapter
                saveSettings(); // Save current state
                // Close side nav on mobile after selection
                if (window.innerWidth <= 768) {
                    sideNav.classList.remove('open');
                    document.body.classList.remove('no-scroll');
                }
            }
        }
    });

    // Navigation Arrows Click
    prevChapterButton.addEventListener('click', async () => {
        await loadPreviousPassage();
        prevChapterButton.blur(); // Remove focus after click
    });

    nextChapterButton.addEventListener('click', async () => {
        await loadNextPassage();
        nextChapterButton.blur(); // Remove focus after click
    });

    // Event listener for 'Unbold Proper Nouns' checkbox
    document.getElementById('unbold-proper-toggle').addEventListener('change', async (event) => {
        window.unboldProperNouns = event.target.checked;
        saveSettings();
        await displayChapter(currentBookIndex, currentChapter, false);
    });

    document.getElementById('font-size-slider').addEventListener('input', (event) => {
        verseFontSizeScale = parseInt(event.target.value, 10);
        updateVerseFontSize(verseFontSizeScale);
    });

    // Paragraph Mode Toggle
    document.getElementById('paragraph-toggle').addEventListener('change', async (event) => {
        isParagraphMode = event.target.checked;
        saveSettings();
        await displayChapter(currentBookIndex, currentChapter, false);
    });

    // Show Verse Numbers Toggle
    document.getElementById('show-verse-numbers').addEventListener('change', async (event) => {
        showVerseNumbers = event.target.checked;
        saveSettings(); // Save the new state
        await displayChapter(currentBookIndex, currentChapter, false);
    });

    mounceSelect.addEventListener('change', async (event) => {
        mounceChapterSelected = parseInt(event.target.value, 10);
        await displayChapter(currentBookIndex, currentChapter, false);
    });

    // Handle window resize to ensure side nav is visible on desktop
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768) {
                sideNav.classList.remove('open');
                document.body.classList.remove('no-scroll');
            }
        }, 150);
    });

    // Close side navigation when clicking on the backdrop
    const sideNavBackdrop = document.getElementById('side-nav-backdrop');
    sideNavBackdrop.addEventListener('click', () => {
        sideNav.classList.remove('open');
        document.body.classList.remove('no-scroll');
        hamburgerButton.setAttribute('aria-expanded', 'false');
    });

    // Hide tooltip when clicking outside
    document.addEventListener('click', (event) => {
        if (
            tooltipElement.classList.contains('visible') &&
            !tooltipElement.contains(event.target) &&
            !event.target.classList.contains('bold-word') &&
            !event.target.classList.contains('unbold-word')
        ) {
            hideTooltip();
        }
    });

    // Handle touch events for mobile
    document.addEventListener('touchstart', (event) => {
        if (
            tooltipElement.classList.contains('visible') &&
            !tooltipElement.contains(event.target) &&
            !event.target.classList.contains('bold-word') &&
            !event.target.classList.contains('unbold-word')
        ) {
            hideTooltip();
        }
    });

    // Delegated click event for word spans
    content.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('bold-word') || target.classList.contains('unbold-word')) {
            event.stopPropagation();
            const wordInfoString = target.dataset.wordInfo;
            if (wordInfoString) {
                const wordInfo = JSON.parse(wordInfoString);
                showTooltip(event, wordInfo);
            }
        }
    });

    // Delegated touch events with scroll detection
    // touchstart: record the start coordinates if a word span is touched.
    content.addEventListener('touchstart', (event) => {
        const target = event.target;
        if (target.classList.contains('bold-word') || target.classList.contains('unbold-word')) {
            lastTouch = {
                target: target,
                startX: event.touches[0].clientX,
                startY: event.touches[0].clientY,
                isScrolling: false
            };
        }
    });

    // touchmove: if the touch moves more than a threshold, mark it as scrolling.
    content.addEventListener('touchmove', (event) => {
        if (!lastTouch) return;
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const deltaX = Math.abs(currentX - lastTouch.startX);
        const deltaY = Math.abs(currentY - lastTouch.startY);
        if (deltaX > 10 || deltaY > 10) {
            lastTouch.isScrolling = true;
        }
    });

    // touchend: if the touch did not move much (i.e. it was a tap) then show the tooltip.
    content.addEventListener('touchend', (event) => {
        if (!lastTouch) return;
        const target = event.target;
        if ((target.classList.contains('bold-word') || target.classList.contains('unbold-word')) && !lastTouch.isScrolling) {
            event.stopPropagation();
            const wordInfoString = target.dataset.wordInfo;
            if (wordInfoString) {
                const wordInfo = JSON.parse(wordInfoString);
                showTooltip(event, wordInfo);
            }
        }
        lastTouch = null;
    });
}