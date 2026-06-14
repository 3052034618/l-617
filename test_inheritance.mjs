import { persistentStore } from './api/data/persistentStore.js'
import DataStore from './api/data/store.js'

console.log('=== 测试继承 ===')
console.log('persistentStore instanceof PersistentDataStore:', persistentStore.constructor.name)
console.log('persistentStore instanceof DataStore:', persistentStore instanceof DataStore)

console.log('\n=== 测试方法重写 ===')
console.log('persistentStore.saveToStorage:', persistentStore.saveToStorage)
console.log('DataStore.prototype.saveToStorage:', DataStore.prototype.saveToStorage)
console.log('是否相同:', persistentStore.saveToStorage === DataStore.prototype.saveToStorage)

console.log('\n=== 测试 addTask 方法 ===')
console.log('persistentStore.addTask:', persistentStore.addTask)
console.log('DataStore.prototype.addTask:', DataStore.prototype.addTask)
console.log('是否相同:', persistentStore.addTask === DataStore.prototype.addTask)

console.log('\n=== 调用 addTask 测试 ===')
const task = persistentStore.addTask({
  name: '测试继承任务',
  region: '测试区域',
})
console.log('任务创建成功:', task.id)
console.log('当前 uploadedFiles 数量:', persistentStore.uploadedFiles.length)

console.log('\n=== 添加上传文件测试 ===')
const file = persistentStore.addUploadedFile({
  filename: 'test.dat',
  originalName: 'test.dat',
  type: 'profile',
  size: 100,
  uploadTime: new Date().toISOString(),
  validationStatus: 'valid',
  validationMessage: '测试',
  filePath: '/tmp/test.dat',
})
console.log('文件添加成功:', file.id)
console.log('当前 uploadedFiles 数量:', persistentStore.uploadedFiles.length)

console.log('\n=== 等待 2 秒后检查 db.json ===')
setTimeout(async () => {
  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const dbPath = path.join(__dirname, 'api', 'data', 'db.json')
  
  if (fs.existsSync(dbPath)) {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    console.log('db.json 存在')
    console.log('uploadedFiles 数量:', data.uploadedFiles.length)
    console.log('tasks 数量:', data.tasks.length)
  } else {
    console.log('db.json 不存在')
  }
}, 2000)
