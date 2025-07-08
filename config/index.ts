import type { AppInfo } from '@/types/app'
export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID}`
export const API_KEY = `${process.env.NEXT_PUBLIC_APP_KEY}`
export const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`
//*****************修改开始******//
export const MODEL_NAME = `${process.env.NEXT_PUBLIC_MODEL_NAME}`
//*****************修改结束******//

export const APP_INFO: AppInfo = {
  title: 'Chat APP',
  description: '',
  copyright: '',
  privacy_policy: '',
  default_language: 'zh-Hans',
  //*****************修改开始******//
  // 使用环境变量中的模型名
  modelName: MODEL_NAME || '未知模型',

 
  //*****************修改结束******//
}

export const isShowPrompt = true
export const promptTemplate = 'I want you to act as a javascript console.'

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
