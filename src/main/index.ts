import { app, shell, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { Model } from 'objection'
import Knex from 'knex'
import sqlite3 from 'better-sqlite3'
import * as fs from 'fs'

// 将日志信息写入文件
// 获取用户文档目录
const userDocumentsDir = app.getPath('documents')
// 构造日志文件路径
const logFilePath = path.join(userDocumentsDir, 'log.txt')
function writeToLog(message: string): void {
  fs.writeFile(logFilePath, message + '\n', { flag: 'a+' }, function (err) {
    if (err) {
      console.error('Error writing to log file:', err)
    } else {
      console.log('Log message written to log.txt:', message)
    }
  })
}
//import knexConfig from './knexfile'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

// 创建 SQLite3 连接
const dbPath = path.join(app.getPath('userData'), 'example.db')
const db = new sqlite3(dbPath)
console.log('init dbPath', dbPath)
console.log('init db', db)
// 使用 Knex 连接到数据库
const knex = Knex({
  client: 'better-sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: dbPath //'./example.db'
  }
})

// 创建表
if (false) {
  knex.schema
    .createTable('users', function (table) {
      table.increments('id') // 自增主键 id
      table.string('name') // 名称字段
    })
    .then(function () {
      // 向表中插入数据
      return knex('users').insert({ name: 'John' })
    })
    .then(function () {
      // 插入数据成功后的操作
      console.log('Data inserted successfully.')
    })
    .catch(function (error) {
      // 插入数据时出错的处理
      console.error('Error inserting data:', error)
    })
    .finally(function () {
      // 不管操作成功或失败，都会执行的操作
      // 关闭数据库连接
      //knex.destroy()
    })
}
/* 运行迁移
knex.migrate
  .latest({
    directory: path.resolve(__dirname, './migrations') // 指定迁移文件的目录
  })
  .then(() => {
    console.log('Migration successful.')
  })
  .catch((error) => {
    console.error('Migration failed:', error)
  })
  .finally(() => {
    knex.destroy() // 关闭数据库连接
  })*/
// 使用 Objection.js 绑定 Model 到 Knex 实例
Model.knex(knex)

knex
  .raw("SELECT name FROM sqlite_master WHERE type='table'")
  .then((rows) => {
    rows.forEach((row) => {
      console.log('find table ===>', row.name)
      writeToLog('find table ===>' + row.name)
    })
  })
  .catch((error) => {
    console.error('Error fetching tables:', error)
  })

// 使用 Knex 查询数据库中的 users 表格
knex
  .select('*')
  .from('users')
  .then((users) => {
    console.log('knex.query->', users)
    writeToLog("select('*').from('users')")
  })
  .catch((error) => {
    console.error('Error fetching users:', error)
    writeToLog('Error fetching users:' + error)
  })

// 创建模型
class User extends Model {
  static tableName = 'users'
}

// 在需要的地方直接使用模型和数据库连接
async function getUsers(): Promise<User[]> {
  const users = await User.query()
  return users
}

getUsers()
  .then((users) => {
    console.log('User.query =>', users) // 处理用户数据
  })
  .catch((error) => {
    console.error('Error fetching users:', error)
  })
