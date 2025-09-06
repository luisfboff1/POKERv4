
import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function log(msg){
  try{
    const p = path.join(app.getPath('userData'),'log.txt')
    fs.appendFileSync(p, `[${new Date().toISOString()}] ${msg}\n`)
  }catch{}
}

process.on('uncaughtException', (e)=>{ log('uncaughtException: '+e.stack) })
process.on('unhandledRejection', (e)=>{ log('unhandledRejection: '+e) })

const dataDir = () => {
  const dir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}
const historyFile = () => path.join(dataDir(), 'history.json')

function readHistory() {
  try {
    const p = historyFile()
    if (!fs.existsSync(p)) return []
    const raw = fs.readFileSync(p, 'utf-8')
    return JSON.parse(raw) || []
  } catch (e) {
    log('readHistory error: '+e.message)
    return []
  }
}
function writeHistory(arr) {
  try {
    fs.writeFileSync(historyFile(), JSON.stringify(arr, null, 2), 'utf-8')
  } catch (e) { log('writeHistory error: '+e.message) }
}

let win
function createWindow () {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) { win.loadURL(devUrl) }
  else { win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html')) }

  // enable opening devtools with shortcut in prod
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.openDevTools()
    }
  })
}

app.whenReady().then(() => {
  ipcMain.handle('get-history', () => { log('IPC get-history'); return readHistory() })
  ipcMain.handle('save-session', (_evt, snapshot) => {
    log('IPC save-session')
    const hist = readHistory()
    hist.unshift(snapshot)
    writeHistory(hist)
    return hist
  })
  ipcMain.handle('delete-session', (_evt, id) => {
    log('IPC delete-session')
    const hist = readHistory().filter(s => s.id !== id)
    writeHistory(hist)
    return hist
  })

  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
