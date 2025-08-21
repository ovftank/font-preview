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

const updateNotification = document.getElementById('update-notification');
const updateIcon = document.getElementById('update-icon');
const updateTitle = document.getElementById('update-title');
const updateMessage = document.getElementById('update-message');
const updateProgress = document.getElementById('update-progress');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressSpeed = document.getElementById('progress-speed');
const updateActions = document.getElementById('update-actions');
const installUpdateBtn = document.getElementById('install-update');
const dismissUpdateBtn = document.getElementById('dismiss-update');
const closeNotificationBtn = document.getElementById('close-notification');

let updateInfo = null;

const showUpdateNotification = (status, data) => {
    updateNotification.classList.remove('hidden');

    switch (status) {
        case 'checking':
            updateIcon.className = 'fas fa-sync-alt fa-spin text-blue-500 text-lg';
            updateTitle.textContent = 'Checking for updates...';
            updateMessage.textContent = data.message;
            updateProgress.classList.add('hidden');
            updateActions.classList.add('hidden');
            break;

        case 'available':
            updateIcon.className = 'fas fa-download text-green-500 text-lg';
            updateTitle.textContent = 'Update Available';
            updateMessage.textContent = data.message;
            updateInfo = data;
            updateProgress.classList.add('hidden');
            updateActions.classList.add('hidden');
            break;

        case 'downloading': {
            updateIcon.className = 'fas fa-download text-blue-500 text-lg';
            updateTitle.textContent = 'Downloading Update';
            updateMessage.textContent = data.message;
            updateProgress.classList.remove('hidden');
            updateActions.classList.add('hidden');

            const percent = data.percent || 0;
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${percent}%`;

            if (data.bytesPerSecond) {
                const speed = formatBytes(data.bytesPerSecond);
                progressSpeed.textContent = `${speed}/s`;
            }
            break;
        }

        case 'downloaded':
            updateIcon.className = 'fas fa-check-circle text-green-500 text-lg';
            updateTitle.textContent = 'Update Ready';
            updateMessage.textContent = data.message;
            updateProgress.classList.add('hidden');
            updateActions.classList.remove('hidden');
            break;

        case 'not-available':
            updateIcon.className = 'fas fa-check text-green-500 text-lg';
            updateTitle.textContent = 'Up to Date';
            updateMessage.textContent = data.message;
            updateProgress.classList.add('hidden');
            updateActions.classList.add('hidden');

            setTimeout(() => {
                hideUpdateNotification();
            }, 3000);
            break;

        case 'error':
            updateIcon.className = 'fas fa-exclamation-triangle text-red-500 text-lg';
            updateTitle.textContent = 'Update Error';
            updateMessage.textContent = data.message;
            updateProgress.classList.add('hidden');
            updateActions.classList.add('hidden');

            setTimeout(() => {
                hideUpdateNotification();
            }, 5000);
            break;
    }
};

const hideUpdateNotification = () => {
    updateNotification.classList.add('hidden');
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const setupUpdateListeners = () => {
    window.electronAPI.onUpdateStatus((event, data) => {
        showUpdateNotification(data.status, data);
    });

    installUpdateBtn.addEventListener('click', () => {
        window.electronAPI.installUpdate();
    });

    dismissUpdateBtn.addEventListener('click', () => {
        hideUpdateNotification();
    });

    closeNotificationBtn.addEventListener('click', () => {
        hideUpdateNotification();
    });
};

document.addEventListener('DOMContentLoaded', () => {
    init();
    setupUpdateListeners();
});
