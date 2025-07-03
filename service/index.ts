import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnNodeFinished, IOnNodeStarted, IOnThought, IOnWorkflowFinished, IOnWorkflowStarted } from './base'
import { get, post, ssePost } from './base'
import type { Feedbacktype,RolesInfosResponse} from '@/types/app'


export const sendChatMessage = async (
  body: Record<string, any>,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onError,
    getAbortController,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onNodeStarted,
    onNodeFinished,
    onWorkflowFinished,
  }: {
    onData: IOnData
    onCompleted: IOnCompleted
    onFile: IOnFile
    onThought: IOnThought
    onMessageEnd: IOnMessageEnd
    onMessageReplace: IOnMessageReplace
    onError: IOnError
    getAbortController?: (abortController: AbortController) => void
    onWorkflowStarted: IOnWorkflowStarted
    onNodeStarted: IOnNodeStarted
    onNodeFinished: IOnNodeFinished
    onWorkflowFinished: IOnWorkflowFinished
  },
) => {
  return ssePost('chat-messages', {
    body: {
      ...body,
      response_mode: 'streaming',
    },
  }, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace, onNodeStarted, onWorkflowStarted, onWorkflowFinished, onNodeFinished })
}

//获取左侧的会话列表
export const fetchConversations = async () => {
  return get('conversations', { params: { limit: 100, first_id: '' } })
}

//拿id的列表
export const fetchChatList = async (conversationId: string) => {
  return get('messages', { params: { conversation_id: conversationId, limit: 100, last_id: '' } })
}

// init value. wait for server update
export const fetchAppParams = async () => {
  return get('parameters')
}

export const updateFeedback = async ({ url, body }: { url: string; body: Feedbacktype }) => {
  return post(url, { body })
}

//生成对话名称  暂时没调用了
export const generationConversationName = async (id: string) => {
  return post(`conversations/${id}/name`, { body: { auto_generate: false } })
}


//添加roles_infos接口信息
// 根据模型名称获取角色提示列表
// export const fetchRolesInfos = async (modelName: string) =>{
//   // 直接调用后端服务，绕过API_PREFIX
//   const response = await fetch(`http://localhost:8080/api/v1/prompts/query/${modelName}`)
//   return response.json()
// }


export const fetchRolesInfos = async (modelName: string) =>{
  return get(`/v1/prompts/query/${modelName}`)
}