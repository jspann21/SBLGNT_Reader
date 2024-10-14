// script.js

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

// DOM Elements
const content = document.getElementById('content');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeButton = document.querySelector('.close-button');
const mounceSelect = document.getElementById('mounce-chapter');
const themeToggle = document.getElementById('theme-toggle');
const saveSettingsButton = document.getElementById('save-settings-button');

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

// Create Spinner Element
const spinner = document.createElement('div');
spinner.classList.add('loading-spinner');
spinner.style.display = 'none'; // Initially hidden
document.body.appendChild(spinner);

// Create Tooltip Element
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.classList.add('tooltip');
document.body.appendChild(tooltip);

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
    const storedTooltips = localStorage.getItem('enableTooltips'); // Load tooltip setting

    if (storedBookIndex !== null && storedChapter !== null) {
        currentBookIndex = parseInt(storedBookIndex, 10);
        currentChapter = parseInt(storedChapter, 10);
        console.log(`Loaded Current State: Book Index ${currentBookIndex}, Chapter ${currentChapter}`);
    }

    if (storedMounce) {
        mounceChapterSelected = parseInt(storedMounce, 10);
        console.log(`Loaded Mounce Chapter Setting: ${mounceChapterSelected}`);
    }

    if (storedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.checked = true;
        console.log('Loaded Theme Setting: Dark Mode');
    }

    if (storedVerseFontSizeScale) {
        verseFontSizeScale = parseInt(storedVerseFontSizeScale, 10);
        updateVerseFontSize(verseFontSizeScale);
        document.getElementById('font-size-slider').value = verseFontSizeScale;
        console.log(`Loaded Verse Font Size Setting: Scale ${verseFontSizeScale}`);
    }

    if (storedParagraphMode) {
        isParagraphMode = storedParagraphMode === 'true';
        document.getElementById('paragraph-toggle').checked = isParagraphMode;
        console.log(`Loaded Paragraph Mode Setting: ${isParagraphMode}`);
    }

    if (storedShowVerseNumbers) {
        showVerseNumbers = storedShowVerseNumbers === 'true';
        document.getElementById('show-verse-numbers').checked = showVerseNumbers;
        console.log(`Loaded Show Verse Numbers Setting: ${showVerseNumbers}`);
    }

    // Load the tooltip setting (default: true if not set)
    const enableTooltips = storedTooltips === null ? true : storedTooltips === 'true';
    document.getElementById('tooltip-toggle').checked = enableTooltips;
    window.enableTooltips = enableTooltips;
    console.log(`Loaded Tooltip Setting: ${enableTooltips}`);
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

    // Save tooltip setting
    const enableTooltips = document.getElementById('tooltip-toggle').checked;
    localStorage.setItem('enableTooltips', enableTooltips);
    window.enableTooltips = enableTooltips;

    console.log('Settings Saved');
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

// Fetch Data: Mounce Vocab and Books List
async function fetchData() {
    try {
        // Fetch Mounce Vocab
        const mounceResponse = await fetch('mounce_vocab.json');
        if (!mounceResponse.ok) {
            throw new Error(`Failed to fetch mounce_vocab.json: ${mounceResponse.statusText}`);
        }
        mounceVocab = await mounceResponse.json();
        console.log('Mounce Vocab Loaded');

        // Populate Mounce Chapter dropdown
        populateMounceSelect();

        // Fetch available books
        await loadAvailableBooks();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Load Available Books and Populate Side Navigation with Accordion Chapters
async function loadAvailableBooks() {
    try {
        const response = await fetch('sblgnt_json/books.json'); // Fetch English book names
        if (!response.ok) {
            throw new Error(`Failed to fetch books.json: ${response.statusText}`);
        }
        booksList = await response.json();
        console.log('Books List Loaded:', booksList);

        booksList.forEach((book, index) => {
            const bookItem = document.createElement('li');
            bookItem.classList.add('book-item');
            bookItem.dataset.index = index;

            // Book Title (use Greek name for display if available, else fallback to English)
            const bookTitle = document.createElement('div');
            bookTitle.classList.add('book-title');
            bookTitle.textContent = bookNameMapping[book] || book; // Display Greek if available
            bookItem.appendChild(bookTitle);

            // Chapter Grid (Accordion Content)
            const chaptersDiv = document.createElement('div');
            chaptersDiv.classList.add('chapter-grid', 'hidden');
            bookItem.appendChild(chaptersDiv);

            bookListElement.appendChild(bookItem);
        });

        const defaultBookIdx = booksList.indexOf("Matthew");
        if (defaultBookIdx !== -1) {
            currentBookIndex = defaultBookIdx;
        } else {
            currentBookIndex = 0; // Fallback to the first book if "Matthew" is not found
        }
        console.log(`Default Book Selected: ${booksList[currentBookIndex]} (Index: ${currentBookIndex})`);
        highlightSelectedBook();
        await loadBookData(currentBookIndex);
        const maxChap = getMaxChapter(currentBookIndex);
        populateChaptersInBook(currentBookIndex, maxChap);
    } catch (error) {
        console.error('Error loading available books:', error);
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
        chapterButton.textContent = chap;
        chapterButton.classList.add('chapter-button');
        chapterButton.dataset.chapter = chap;
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


// Load Book Data by Index
async function loadBookData(bookIdx) {
    const bookName = booksList[bookIdx];
    const fileName = bookName.replace(/ /g, ''); // Remove spaces if JSON filenames don't have spaces
    try {
        const response = await fetch(`sblgnt_json/${fileName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${fileName}.json: ${response.statusText}`);
        }
        const data = await response.json();
        // Extract the book data directly
        sblgntData = data[bookName];
        if (!sblgntData) {
            throw new Error(`Book data for ${bookName} not found in JSON.`);
        }
        console.log(`Loaded data for ${bookName}`);
    } catch (error) {
        console.error(`Error loading book ${bookName}:`, error);
        sblgntData = {}; // Reset to prevent incorrect data usage
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
    const maxChap = Object.keys(bookData).length;
    console.log(`Maximum Chapters in ${bookName}: ${maxChap}`);
    return maxChap;
}

// Populate Mounce Chapter Dropdown
function populateMounceSelect() {
    mounceSelect.innerHTML = '<option value="99">None</option>';

    const mounceChapters = Object.keys(mounceVocab).map(chapterStr => parseInt(chapterStr, 10));
    const uniqueChapters = Array.from(new Set(mounceChapters)).sort((a, b) => a - b);

    uniqueChapters.forEach(chapterNum => {
        const option = document.createElement('option');
        option.value = chapterNum;
        option.textContent = chapterNum;
        mounceSelect.appendChild(option);
    });

    mounceSelect.value = mounceChapterSelected;
    console.log('Mounce Chapter Dropdown Populated');
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
        // Paragraph mode: handle paragraphs with suffixes (e.g., "6a", "6b") as separate.
        const formattedChapter = String(chapter).padStart(3, '0');
        try {
            const paragraphResponse = await fetch(`sblgnt_json/paragraphs/${bookName}/${formattedChapter}-paragraphs.json`);
            if (paragraphResponse.ok) {
                const paragraphs = await paragraphResponse.json(); // Directly use the array from file

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

                    chapterElement.appendChild(paragraphElement); // Add paragraph to chapterElement
                });
            }
        } catch (error) {
            console.error(`Error fetching paragraph data for ${bookName} ${formattedChapter}:`, error);
        }
    } else {
        // Non-paragraph mode: Combine verses with suffixes into one base verse (e.g., "6", "6a", "6b" → "6").
        const combinedVerses = {};

        // Traverse chapterData to detect and group suffixes like "6a", "6b", etc.
        Object.keys(chapterData).forEach(verseNum => {
            const baseVerseNum = verseNum.replace(/[a-z]$/, ''); // Remove any letter suffix (e.g., "6a" → "6")

            if (!combinedVerses[baseVerseNum]) {
                combinedVerses[baseVerseNum] = [];
            }

            combinedVerses[baseVerseNum].push(...chapterData[verseNum]);
        });

        // Render the combined verses
        Object.keys(combinedVerses).forEach(verseNum => {
            const verseElement = document.createElement('div');
            verseElement.classList.add('verse');
            verseElement.id = `chapter-${chapter}-verse-${verseNum}`;
            addVerseContent(verseElement, combinedVerses[verseNum]);
            chapterElement.appendChild(verseElement); // Add verse to chapterElement
        });
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
    console.log(`Displayed ${bookName} Chapter ${chapter}`);
}

// Load Next Chapter
async function loadNextPassage() {
    if (isLoading) return;
    isLoading = true;
    spinner.style.display = 'block';
    console.log('Loading Next Chapter');

    const bookName = booksList[currentBookIndex];
    const totalChapters = getMaxChapter(currentBookIndex);

    if (currentChapter < totalChapters) {
        currentChapter += 1;
        console.log(`Next Chapter in Same Book: ${bookName} Chapter ${currentChapter}`);
    } else if (currentBookIndex < booksList.length - 1) {
        currentBookIndex += 1;
        currentChapter = 1;
        console.log(`Moving to Next Book: ${booksList[currentBookIndex]} Chapter ${currentChapter}`);
        await loadBookData(currentBookIndex);
        highlightSelectedBook();
        const maxChap = getMaxChapter(currentBookIndex);
        populateChaptersInBook(currentBookIndex, maxChap);
    } else {
        // Reached the end of the Bible
        console.log('Reached the End of the Bible');
        alert('You have reached the end of the Bible.');
        isLoading = false;
        spinner.style.display = 'none';
        return;
    }

    // Load and display the next chapter
    await displayChapter(currentBookIndex, currentChapter, true);

    // Update side navigation
    updateSideNav();

    spinner.style.display = 'none';
    isLoading = false;
}

// Load Previous Chapter
async function loadPreviousPassage() {
    if (isLoading) return;
    isLoading = true;
    spinner.style.display = 'block';
    console.log('Loading Previous Chapter');

    if (currentChapter > 1) {
        currentChapter -= 1;
        console.log(`Previous Chapter in Same Book: ${booksList[currentBookIndex]} Chapter ${currentChapter}`);
    } else if (currentBookIndex > 0) {
        currentBookIndex -= 1;
        await loadBookData(currentBookIndex);
        highlightSelectedBook();
        currentChapter = getMaxChapter(currentBookIndex);
        console.log(`Last Chapter of Previous Book: ${booksList[currentBookIndex]} Chapter ${currentChapter}`);
        const maxChap = getMaxChapter(currentBookIndex);
        populateChaptersInBook(currentBookIndex, maxChap);
    } else {
        // Reached the beginning of the Bible
        console.log('Reached the Beginning of the Bible');
        alert('You are already at the beginning of the Bible.');
        isLoading = false;
        spinner.style.display = 'none';
        return;
    }

    // Load and display the previous chapter
    await displayChapter(currentBookIndex, currentChapter, true);

    // Update side navigation
    updateSideNav();

    spinner.style.display = 'none';
    isLoading = false;
}


// Determine if a Word Should Be Unbolded
function shouldUnbold(wordMounceChapter) {
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
        verseNumber.textContent = parseInt(verseNumStr.slice(-2), 10); // Set as text content
        verseElement.appendChild(verseNumber);
    }

    verseWords.forEach(wordInfo => {
        const wordSpan = document.createElement('span');
        wordSpan.textContent = wordInfo.word_forms[0] + ' ';
        wordSpan.style.fontFamily = 'sbl_greek, serif';

        if (shouldUnbold(wordInfo.mounce_chapter)) {
            wordSpan.classList.add('unbold-word');
        } else {
            wordSpan.classList.add('bold-word');
        }
        // Variables to track touch position and movement
        let touchStartX = 0;
        let touchStartY = 0;
        let isScrolling = false;

        // Touchstart event to record initial touch position
        wordSpan.addEventListener('touchstart', (event) => {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            isScrolling = false; // Reset scroll detection
        });

        // Touchmove event to detect if the user is scrolling
        wordSpan.addEventListener('touchmove', (event) => {
            const touchEndX = event.touches[0].clientX;
            const touchEndY = event.touches[0].clientY;

            // Calculate the distance moved
            const deltaX = Math.abs(touchEndX - touchStartX);
            const deltaY = Math.abs(touchEndY - touchStartY);

            // If the movement is significant, consider it scrolling, not tapping
            if (deltaX > 10 || deltaY > 10) {
                isScrolling = true; // User is scrolling
            }
        });

        // Touchend event to determine if it's a tap or scroll
        wordSpan.addEventListener('touchend', (event) => {
            if (!isScrolling) {
                // If it's not scrolling, consider it a tap
                event.stopPropagation(); // Prevent event bubbling
                showTooltip(event, wordInfo); // Show tooltip
            }
        });

        // For desktop clicks
        wordSpan.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            showTooltip(event, wordInfo); // Show tooltip
        });

        verseElement.appendChild(wordSpan);
    });
}

function showTooltip(event, wordInfo) {
    if (!window.enableTooltips) {
        return; // Exit early if tooltips are disabled
    }

    const tooltip = document.getElementById('tooltip');

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
            <span class="tooltip-close"><a href="#" onclick="hideTooltip(event)">&times;</a></span>
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
    const tooltip = document.getElementById('tooltip');
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
            console.log('Side Navigation Closed when Settings Modal Opened');
        }

        // Open the settings modal
        settingsModal.classList.remove('hidden');
        console.log('Settings Modal Opened');
    });

    // Close Button Click
    closeButton.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        console.log('Settings Modal Closed');
    });

    // Click Outside Modal to Close
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.classList.add('hidden');
            console.log('Settings Modal Closed by Clicking Outside');
        }
    });

    window.addEventListener('scroll', () => {
        hideTooltip(); // Always hide tooltips when scrolling

        if (sideNav.classList.contains('open')) {
            // Force a reflow by briefly hiding and showing the side-nav
            sideNav.style.display = 'none';
            sideNav.offsetHeight; // Trigger reflow by accessing offsetHeight
            sideNav.style.display = ''; // Restore display
        }
    });

    // Save Settings Button Click
    saveSettingsButton.addEventListener('click', () => {
        mounceChapterSelected = parseInt(mounceSelect.value, 10);
        console.log(`Mounce Chapter Selected: ${mounceChapterSelected}`);

        // Save the settings
        saveSettings();

        // Close the modal
        settingsModal.classList.add('hidden');
        console.log('Settings Modal Closed After Saving');

        // Reload the current chapter to apply unbolding
        displayChapter(currentBookIndex, currentChapter, false);
    });

    // Theme Toggle Change
    themeToggle.addEventListener('change', (event) => {
        if (event.target.checked) {
            document.body.classList.add('dark');
            console.log('Dark Mode Enabled');
        } else {
            document.body.classList.remove('dark');
            console.log('Dark Mode Disabled');
        }
        // Settings are saved when 'Save' button is clicked
    });

    // Hamburger Button Click (Toggle Side Navigation)
    hamburgerButton.addEventListener('click', () => {
        // Close settings modal if it's open
        if (!settingsModal.classList.contains('hidden')) {
            settingsModal.classList.add('hidden');
            console.log('Settings Modal Closed when Side Navigation Opened');
        }
        hideTooltip();

        // Toggle side navigation
        sideNav.classList.toggle('open');
        document.body.classList.toggle('no-scroll'); // Prevent background scrolling when menu is open
        console.log('Side Navigation Toggled');
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

    document.getElementById('font-size-slider').addEventListener('input', (event) => {
        verseFontSizeScale = parseInt(event.target.value, 10);
        updateVerseFontSize(verseFontSizeScale);
        console.log(`Font Size Slider Changed: Scale ${verseFontSizeScale}`);
    });

    // Paragraph Mode Toggle
    document.getElementById('paragraph-toggle').addEventListener('change', (event) => {
        isParagraphMode = event.target.checked;
        saveSettings(); // Save the new state
        displayChapter(currentBookIndex, currentChapter, false); // Re-render current chapter
        console.log(`Paragraph Mode Toggled: ${isParagraphMode}`);
    });

    // Show Verse Numbers Toggle
    document.getElementById('show-verse-numbers').addEventListener('change', (event) => {
        showVerseNumbers = event.target.checked;
        saveSettings(); // Save the new state
        displayChapter(currentBookIndex, currentChapter, false); // Re-render current chapter with/without verse numbers
        console.log(`Show Verse Numbers Toggled: ${showVerseNumbers}`);
    });

    mounceSelect.addEventListener('change', (event) => {
        mounceChapterSelected = parseInt(event.target.value, 10);
        console.log(`Mounce Vocab Chapter changed to: ${mounceChapterSelected}`);
        displayChapter(currentBookIndex, currentChapter, false);
    });

    // Handle window resize to ensure side nav is visible on desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sideNav.classList.remove('hidden');
            sideNav.classList.remove('open');
            document.body.classList.remove('no-scroll');
        } else {
            sideNav.classList.add('hidden');
        }
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
        const tooltip = document.getElementById('tooltip');
        if (
            tooltip.classList.contains('visible') &&
            !tooltip.contains(event.target) &&
            !event.target.classList.contains('bold-word') &&
            !event.target.classList.contains('unbold-word')
        ) {
            hideTooltip();
        }
    });

    // Handle touch events for mobile
    document.addEventListener('touchstart', (event) => {
        const tooltip = document.getElementById('tooltip');
        if (
            tooltip.classList.contains('visible') &&
            !tooltip.contains(event.target) &&
            !event.target.classList.contains('bold-word') &&
            !event.target.classList.contains('unbold-word')
        ) {
            hideTooltip();
        }
    });

    document.getElementById('save-settings-button').addEventListener('click', () => {
        saveSettings();
        document.getElementById('settings-modal').classList.add('hidden');
        displayChapter(currentBookIndex, currentChapter, false);
    });

}