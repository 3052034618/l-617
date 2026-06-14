import { Router, type Request, type Response } from 'express'
import { persistentStore as store } from '../data/persistentStore.js'

const router = Router()

router.get('/bands', (req: Request, res: Response): void => {
  try {
    const bands = store.getRecommendBands()
    res.json({
      success: true,
      data: bands,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取推荐波段组合失败',
    })
  }
})

router.get('/parameters', (req: Request, res: Response): void => {
  try {
    const parameters = store.getRecommendParameters()
    res.json({
      success: true,
      data: parameters,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取推荐参数配置失败',
    })
  }
})

router.get('/history', (req: Request, res: Response): void => {
  try {
    const history = store.getRecommendHistory()
    res.json({
      success: true,
      data: history,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取历史推荐记录失败',
    })
  }
})

export default router
