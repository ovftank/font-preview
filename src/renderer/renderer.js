const searchInput = document.getElementById('search');
const fontList = document.getElementById('font-list');
const fontCount = document.getElementById('font-count');
const previewDisplay = document.getElementById('preview-display');
const fontSizeInput = document.getElementById('font-size');
const fontInfo = document.getElementById('font-info');
const loading = document.getElementById('loading');

let allFonts = [];
let filteredFonts = [];
let selectedFont = null;

const init = async () => {
    try {
        if (!window.electronAPI?.getFonts) {
            throw new Error('electronAPI not available');
        }

        allFonts = await window.electronAPI.getFonts();

        filteredFonts = [...allFonts];
        loading.style.display = 'none';
        renderFontList();
        setupEventListeners();
    } catch (error) {
        loading.innerHTML = /*HTML*/ `
            <div class="px-3 py-1.5 border-b border-gray-100 cursor-pointer text-[11px] text-center py-5 text-red-500">
                <i class="fas fa-exclamation-triangle text-base mb-2 block"></i>
                <div class="text-[10px]">Failed to load fonts: ${error.message}</div>
            </div>
        `;
    }
};

const renderFontList = () => {
    fontCount.textContent = filteredFonts.length;

    if (filteredFonts.length === 0) {
        fontList.innerHTML = /*HTML*/ `
            <div class="px-3 py-1.5 border-b border-gray-100 cursor-pointer text-[11px] text-center py-5 text-gray-400">
                <i class="fas fa-search text-base mb-2 block"></i>
                <div>No fonts found</div>
            </div>
        `;
        return;
    }

    fontList.innerHTML = filteredFonts
        .map(
            (font) => /*HTML*/ `
            <div class="font-item px-3 py-1.5 border-b border-gray-100 cursor-pointer text-[11px] hover:bg-cyan-50 hover:text-gray-800 selected:bg-blue-500 selected:text-white flex flex-col gap-1" data-family="${font.family}">
                <div class="font-medium text-[11px] text-gray-800">
                    ${font.family}
                </div>
                <div class="font-preview text-[10px] text-gray-600" style="font-family: '${font.family}', sans-serif;">
                    The quick brown fox jumps
                </div>
            </div>
        `
        )
        .join('');

    document.querySelectorAll('.font-item').forEach((item) => {
        item.addEventListener('click', () => {
            const family = item.dataset.family;
            selectFont(family);
        });
    });
};

const selectFont = (family) => {
    selectedFont = allFonts.find((font) => font.family === family);

    if (!selectedFont) return;

    document.querySelectorAll('.font-item').forEach((item) => {
        item.classList.remove('bg-blue-500', 'text-white');
        item.classList.add('hover:bg-cyan-50', 'hover:text-gray-800');
        const nameEl = item.querySelector('.font-medium');
        const previewEl = item.querySelector('.font-preview');
        if (nameEl) nameEl.classList.remove('text-white');
        if (nameEl) nameEl.classList.add('text-gray-800');
        if (previewEl) previewEl.classList.remove('text-white');
        if (previewEl) previewEl.classList.add('text-gray-600');
    });

    const selectedItem = document.querySelector(`[data-family="${family}"]`);
    if (selectedItem) {
        selectedItem.classList.add('bg-blue-500', 'text-white');
        selectedItem.classList.remove('hover:bg-cyan-50', 'hover:text-gray-800');
        const nameEl = selectedItem.querySelector('.font-medium');
        const previewEl = selectedItem.querySelector('.font-preview');
        if (nameEl) nameEl.classList.add('text-white');
        if (nameEl) nameEl.classList.remove('text-gray-800');
        if (previewEl) previewEl.classList.add('text-white');
        if (previewEl) previewEl.classList.remove('text-gray-600');
    }

    updatePreview();
    updateFontInfo();
};

const updatePreview = () => {
    if (!selectedFont) return;

    const fontSize = fontSizeInput.value;
    const fontFamily = `'${selectedFont.family}', sans-serif`;

    const sampleText = `ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789 !@#$%^&*()

Symbols:
→ ← ≠ >= <= != == === => ->
<- -> => == != <= >= && || ++ -- += -= *= /= %= **= ??
<> </> </ /> <!-- --> /*  */ /** */ // /// ///

Icons:
󰈙 󰨜 󰐊 󰖟 󰘮 󰌽 󰟕 󰄉 󱦰
󰑮 󰌛 󰰳 󰜴 󱩄 󰟃 󰇥 󰯫 󰒗`;

    previewDisplay.innerHTML = /*HTML*/ `
        <div class="whitespace-pre break-words text-gray-800 leading-relaxed p-4 bg-white min-h-96 w-full outline-none" contenteditable="true" style="font-family: ${fontFamily}; font-size: ${fontSize}px;">${sampleText}</div>
    `;
};

const updateFontInfo = () => {
    if (!selectedFont) {
        fontInfo.classList.add('hidden');
        return;
    }

    document.getElementById('font-family').textContent = selectedFont.family;
    fontInfo.classList.remove('hidden');
};

const filterFonts = () => {
    const query = searchInput.value.toLowerCase();

    if (query === '') {
        filteredFonts = [...allFonts];
    } else {
        filteredFonts = allFonts.filter((font) => font.family.toLowerCase().includes(query));
    }

    renderFontList();
};

const setupEventListeners = () => {
    searchInput.addEventListener('input', filterFonts);
    fontSizeInput.addEventListener('input', updatePreview);

    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });

    document.getElementById('copy-font-name').addEventListener('click', async () => {
        if (selectedFont) {
            await navigator.clipboard.writeText(selectedFont.family);
            const icon = document.querySelector('#copy-font-name i');
            icon.className = 'fas fa-check text-green-600 text-[10px]';
            setTimeout(() => {
                icon.className = 'fas fa-copy text-gray-600 text-[10px]';
            }, 1000);
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === '=') {
            e.preventDefault();
            const currentSize = parseInt(fontSizeInput.value);
            if (currentSize < 72) {
                fontSizeInput.value = currentSize + 2;
                updatePreview();
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            e.preventDefault();
            const currentSize = parseInt(fontSizeInput.value);
            if (currentSize > 8) {
                fontSizeInput.value = currentSize - 2;
                updatePreview();
            }
        }
    });

    setupSplitter();
};

const setupSplitter = () => {
    const splitter = document.querySelector('.cursor-col-resize');
    const leftPanel = splitter.previousElementSibling;
    const container = splitter.parentElement;

    let isResizing = false;

    splitter.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('select-none');
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const containerRect = container.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;

        const minLeftWidth = 200;
        const maxLeftWidth = containerRect.width - 300;

        if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
            leftPanel.style.width = `${newLeftWidth}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.classList.remove('select-none');
        }
    });
};

document.addEventListener('DOMContentLoaded', init);
