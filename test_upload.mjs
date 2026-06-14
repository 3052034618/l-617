import fs from 'fs'
import FormData from 'form-data'
import http from 'http'

function uploadFile(filePath, type) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', fs.createReadStream(filePath))

    const options = {
      method: 'POST',
      hostname: 'localhost',
      port: 3001,
      path: `/api/upload/${type}`,
      headers: form.getHeaders(),
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve(data)
        }
      })
    })

    req.on('error', reject)
    form.pipe(req)
  })
}

function getFiles() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: 'localhost',
      port: 3001,
      path: '/api/upload/files',
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve(data)
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

async function main() {
  try {
    console.log('=== 测试大气廓线文件上传 ===')
    const profileResult = await uploadFile('./test_profile2.dat', 'profile')
    console.log(JSON.stringify(profileResult, null, 2))

    console.log('\n=== 测试下垫面文件上传 ===')
    const surfaceContent = '区域,类型,面积占比,反射率\n华北平原,农田,0.45,0.18\n长江三角洲,城市,0.35,0.25\n珠江三角洲,水体,0.30,0.05'
    fs.writeFileSync('./test_surface2.csv', surfaceContent, 'utf-8')
    const surfaceResult = await uploadFile('./test_surface2.csv', 'surface')
    console.log(JSON.stringify(surfaceResult, null, 2))

    console.log('\n=== 获取已上传文件列表 ===')
    const filesResult = await getFiles()
    console.log(JSON.stringify(filesResult, null, 2))
  } catch (error) {
    console.error('测试失败:', error.message)
  }
}

main()
