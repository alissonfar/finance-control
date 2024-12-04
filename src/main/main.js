const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');

async function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true,
            enableWebSQL: true,
            nodeIntegrationInWorker: true,
            experimentalFeatures: true,
            // Adicionado suporte a módulos ES
            webviewTag: true,
            sandbox: false
        }
    });

    // Configuração de CSP mais permissiva para desenvolvimento
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;" +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;" +
                    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;" +
                    "img-src 'self' data: blob:;" +
                    "connect-src 'self' data: blob:;" +
                    "font-src 'self' https://cdnjs.cloudflare.com;"
                ]
            }
        });
    });

    // Configuração do protocolo de arquivo com validações de segurança
    protocol.registerFileProtocol('safe-file', (request, callback) => {
        const url = request.url.replace('safe-file://', '');
        try {
            const normalizedPath = path.normalize(`${__dirname}/${url}`);
            if (normalizedPath.startsWith(__dirname)) {
                return callback(normalizedPath);
            } else {
                throw new Error('Tentativa de acesso a arquivo fora do diretório da aplicação');
            }
        } catch (error) {
            console.error('Erro no protocolo safe-file:', error);
            callback({ error: -2 });
        }
    });

    // Configuração para suporte a imports ES6
    protocol.registerFileProtocol('es-module', (request, callback) => {
        const url = request.url.replace('es-module://', '');
        try {
            const filePath = path.normalize(path.join(__dirname, url));
            callback({ path: filePath });
        } catch (error) {
            console.error('Erro ao carregar módulo ES:', error);
            callback({ error: -2 });
        }
    });

    // Carrega a página inicial
    win.loadFile('src/views/index.html');

    // DevTools em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        win.webContents.openDevTools();

        // Hot Reload em desenvolvimento
        const contentsId = win.webContents.id;
        win.webContents.on('did-finish-load', () => {
            win.webContents.send('dev-reload', { contentsId });
        });
    }

    // Gerenciamento de erros da janela
    win.webContents.on('crashed', (event) => {
        console.error('Janela travou:', event);
        app.relaunch();
        app.exit();
    });

    win.on('unresponsive', () => {
        console.error('Janela não está respondendo');
        win.reload();
    });

    return win;
}

// Inicialização da aplicação
app.whenReady().then(async () => {
    try {
        const mainWindow = await createWindow();

        // Registro de protocolos personalizados
        protocol.registerFileProtocol('app', (request, callback) => {
            const filePath = path.normalize(path.join(__dirname, request.url.replace('app://', '')));
            callback({ path: filePath });
        });

        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                await createWindow();
            }
        });

    } catch (error) {
        console.error('Erro na inicialização:', error);
        app.quit();
    }
}).catch(error => {
    console.error('Erro crítico na inicialização:', error);
    app.quit();
});

// Gerenciamento do ciclo de vida
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Manipulação global de erros
process.on('uncaughtException', (error) => {
    console.error('Erro não tratado:', error);
    app.relaunch();
    app.exit();
});

process.on('unhandledRejection', (error) => {
    console.error('Promise rejeitada não tratada:', error);
});

// Limpeza antes de fechar
app.on('before-quit', () => {
    protocol.unregisterProtocol('safe-file');
    protocol.unregisterProtocol('es-module');
    protocol.unregisterProtocol('app');
});