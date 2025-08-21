import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const createWindow = () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const iconPath = path.join(__dirname, 'src/assets/icon.png');
    const htmlPath = path.join(__dirname, 'src/renderer/index.html');
    const preloadPath = path.join(__dirname, 'src/preload.js');

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        icon: iconPath,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: preloadPath,
            spellcheck: false,
            webSecurity: false,
            autoplayPolicy: 'no-user-gesture-required'
        },
        language: 'vi-VN',
        resizable: false,
        frame: false,
        hasShadow: false,
        transparent: true
    });

    win.loadFile(htmlPath);
};

ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
});

ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

ipcMain.handle('get-fonts', async () => {
    return new Promise((resolve) => {
        const psCommand = `powershell -command "Add-Type -AssemblyName System.Drawing; [System.Drawing.FontFamily]::Families | ForEach-Object { $_.Name }"`;

        exec(psCommand, (error, stdout, stderr) => {
            if (error) {
                resolve([]);
                return;
            }

            const fontNames = stdout
                .split('\n')
                .map((name) => name.trim())
                .filter((name) => name.length > 0)
                .map((name) => ({
                    family: name
                }));

            resolve(fontNames);
        });
    });
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});
