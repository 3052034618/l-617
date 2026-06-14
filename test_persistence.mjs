import { persistentStore } from './api/data/persistentStore.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, 'api', 'data', 'db.json')

async function test() {
  console.log('=== 测试持久化功能 ===')
  console.log('DB_PATH:', DB_PATH)

  console.log('\n1. 初始化 store...')
  await persistentStore.init()

  console.log('2. 当前 uploadedFiles 数量:', persistentStore.uploadedFiles.length)

  console.log('\n3. 添加一个测试文件...')
  const file = persistentStore.addUploadedFile({
    filename: 'test.dat',
    originalName: 'test.dat',
    type: 'profile',
    size: 100,
    uploadTime: new Date().toISOString(),
    validationStatus: 'valid',
    validationMessage: '测试文件',
    filePath: '/tmp/test.dat',
  })
  console.log('添加的文件:', JSON.stringify(file, null, 2))

  console.log('\n4. 调用 saveToFile...')
  await persistentStore.saveToFile()

  console.log('\n5. 检查文件是否存在...')
  if (fs.existsSync(DB_PATH)) {
    console.log('✓ db.json 存在')
    const content = fs.readFileSync(DB_PATH, 'utf-8')
    const data = JSON.parse(content)
    console.log('uploadedFiles 数量:', data.uploadedFiles.length)
    if (data.uploadedFiles.length > 0) {
      console.log('第一个文件:', JSON.stringify(data.uploadedFiles[0], null, 2))
    }
  } else {
    console.log('✗ db.json 不存在')
  }

  console.log('\n6. 测试 scheduleSave (等待 2 秒)...')
  persistentStore.addUploadedFile({
    filename: 'test2.dat',
    originalName: 'test2.dat',
    type: 'surface',
    size: 200,
    uploadTime: new Date().toISOString(),
    validationStatus: 'valid',
    validationMessage: '测试文件2',
    filePath: '/tmp/test2.dat',
  })

  await new Promise((resolve) => setTimeout(resolve, 2000))

  const content2 = fs.readFileSync(DB_PATH, 'utf-8')
  const data2 = JSON.parse(content2)
  console.log('scheduleSave 后 uploadedFiles 数量:', data2.uploadedFiles.length)
}

test().catch(console.error)
