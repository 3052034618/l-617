import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { persistentStore as store } from '../data/persistentStore.js'
import {
  validateProfileFile,
  validateSurfaceFile,
  validateFileExtension,
  allowedExtensions,
  maxFileSize,
} from '../utils/fileValidator.js'
import type { UploadedFile, UploadedFileType } from '../types/index.js'
import { formatDate } from '../utils/helpers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const originalName = file.originalname
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
    const newFilename = `${safeBaseName}_${timestamp}${ext}`
    cb(null, newFilename)
  },
})

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (!validateFileExtension(file.originalname)) {
    cb(new Error(`不支持的文件类型。仅支持：${allowedExtensions.join(', ')}`))
    return
  }
  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
})

async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    throw new Error('文件读取失败')
  }
}

async function handleFileUpload(
  req: Request,
  res: Response,
  fileType: UploadedFileType,
): Promise<void> {
  try {
    store.init()

    const uploadSingle = upload.single('file')

    uploadSingle(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              success: false,
              error: `文件大小超过限制。最大支持 ${maxFileSize / 1024 / 1024}MB`,
            })
            return
          }
          res.status(400).json({
            success: false,
            error: `文件上传失败：${err.message}`,
          })
          return
        }
        res.status(400).json({
          success: false,
          error: err instanceof Error ? err.message : '文件上传失败',
        })
        return
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: '没有选择文件',
        })
        return
      }

      const file = req.file
      const filePath = path.join(UPLOAD_DIR, file.filename)

      let validationStatus: UploadedFile['validationStatus'] = 'pending'
      let validationMessage: string | undefined

      try {
        const content = await readFileContent(filePath)

        const validationResult =
          fileType === 'profile'
            ? validateProfileFile(content)
            : validateSurfaceFile(content)

        validationStatus = validationResult.valid ? 'valid' : 'invalid'
        validationMessage = validationResult.message

        const uploadedFile = store.addUploadedFile({
          filename: file.filename,
          originalName: file.originalname,
          type: fileType,
          size: file.size,
          uploadTime: formatDate(),
          validationStatus,
          validationMessage,
          filePath,
        })

        res.json({
          success: true,
          data: {
            file: uploadedFile,
            validation: {
              valid: validationStatus === 'valid',
              message: validationMessage,
              details: validationResult.details,
            },
          },
        })
      } catch (readError) {
        try {
          await fs.unlink(filePath)
        } catch (cleanupError) {
          console.error('清理上传文件失败:', cleanupError)
        }

        res.status(400).json({
          success: false,
          error: readError instanceof Error ? readError.message : '文件处理失败',
        })
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    })
  }
}

router.post('/profile', (req: Request, res: Response): void => {
  void handleFileUpload(req, res, 'profile')
})

router.post('/surface', (req: Request, res: Response): void => {
  void handleFileUpload(req, res, 'surface')
})

router.get('/files', (req: Request, res: Response): void => {
  try {
    store.init()

    const { type } = req.query
    const files = store.getUploadedFiles(type as UploadedFileType)

    res.json({
      success: true,
      data: {
        list: files,
        total: files.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取文件列表失败',
    })
  }
})

router.delete('/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    store.init()

    const { filename } = req.params
    const fileRecord = store.getUploadedFileByFilename(filename)

    if (!fileRecord) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      })
      return
    }

    try {
      await fs.unlink(fileRecord.filePath)
    } catch (fsError) {
      if ((fsError as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('删除物理文件失败:', fsError)
      }
    }

    const deleted = store.deleteUploadedFile(fileRecord.id)

    if (!deleted) {
      res.status(500).json({
        success: false,
        error: '删除文件记录失败',
      })
      return
    }

    res.json({
      success: true,
      data: {
        filename,
        message: '文件删除成功',
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除文件失败',
    })
  }
})

router.get('/validate/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    store.init()

    const { filename } = req.params
    const { type } = req.query

    const fileRecord = store.getUploadedFileByFilename(filename)

    if (!fileRecord) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      })
      return
    }

    const content = await readFileContent(fileRecord.filePath)
    const fileType = (type as UploadedFileType) || fileRecord.type

    const validationResult =
      fileType === 'profile'
        ? validateProfileFile(content)
        : validateSurfaceFile(content)

    res.json({
      success: true,
      data: {
        valid: validationResult.valid,
        message: validationResult.message,
        details: validationResult.details,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '文件校验失败',
    })
  }
})

export default router
