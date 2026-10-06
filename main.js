const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;
let gameProcess = null;

const settingsPath = path.join(app.getPath("userData"), "settings.json");

function loadSettings() {
    try {
        return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    } catch {
        return { gamePath: "" };
    }
}

function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 850,
        backgroundColor: "#07080b",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    mainWindow.loadFile("index.html");
}

ipcMain.handle("choose-game", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: "Выберите игровой EXE",
        properties: ["openFile"],
        filters: [{ name: "Windows программа", extensions: ["exe"] }]
    });

    if (result.canceled) return { success: false };

    const gamePath = result.filePaths[0];
    const settings = loadSettings();

    settings.gamePath = gamePath;
    saveSettings(settings);

    return { success: true, gamePath };
});

ipcMain.handle("get-settings", () => loadSettings());

ipcMain.handle("launch-game", () => {
    const settings = loadSettings();

    if (!settings.gamePath) {
        return {
            success: false,
            message: "Сначала выберите игровой EXE."
        };
    }

    if (!fs.existsSync(settings.gamePath)) {
        return {
            success: false,
            message: "Игровой EXE не найден."
        };
    }

    try {
        gameProcess = spawn(settings.gamePath, [], {
            cwd: path.dirname(settings.gamePath)
        });

        gameProcess.on("exit", () => {
            gameProcess = null;
        });

        return { success: true };
    } catch {
        return {
            success: false,
            message: "Не удалось запустить игру."
        };
    }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
