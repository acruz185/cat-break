// Starts Electron with ELECTRON_RUN_AS_NODE removed.
// VS Code (and tools running inside it) set that variable, which makes Electron
// behave like plain Node, so `ipcMain`, `app`, etc. come back undefined.
const { spawn } = require('node:child_process');
const electronPath = require('electron'); // in Node, this is the path to the Electron binary

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.', ...process.argv.slice(2)], { stdio: 'inherit', env });
child.on('exit', (code) => process.exit(code ?? 0));
