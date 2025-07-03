/* eslint-disable @typescript-eslint/no-use-before-define */
'use client'
// React相关导入
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
// 国际化支持
import { useTranslation } from 'react-i18next'
// 不可变数据处理库，用于状态管理
import produce, { setAutoFreeze } from 'immer'
// 自定义hooks库
import { useBoolean, useGetState } from 'ahooks'
// 自定义hooks
import useConversation from '@/hooks/use-conversation'
// UI组件导入
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import ConfigSence from '@/app/components/config-scence'
import Header from '@/app/components/header'
// API服务函数
import { fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage, updateFeedback } from '@/service'
// 类型定义
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
// 聊天组件
import Chat from '@/app/components/chat'
// 国际化客户端设置
import { setLocaleOnClient } from '@/i18n/client'
// 响应式断点hooks
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
// 加载组件
import Loading from '@/app/components/base/loading'
// 工具函数
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
// 应用不可用组件
import AppUnavailable from '@/app/components/app-unavailable'
// 配置常量
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
// 日志注解类型
import type { Annotation as AnnotationType } from '@/types/log'
// 工具函数
import { addFileInfos, sortAgentSorts } from '@/utils/tools'




import { fetchRolesInfos } from '@/service/index'
import type { RolesInfosItem } from '@/types/app'


// 主组件Props类型定义
export type IMainProps = {
  params: any
}

/**
 * 主聊天应用组件
 * 负责管理整个聊天应用的状态和交互逻辑
 */
const Main: FC<IMainProps> = () => {
  // 国际化翻译函数
  const { t } = useTranslation()
  // 获取当前媒体类型（移动端/桌面端）
  const media = useBreakpoints()
  // 判断是否为移动端
  const isMobile = media === MediaType.mobile
  // 检查应用配置是否完整
  const hasSetAppConfig = APP_ID && API_KEY

  /*
  * 应用信息相关状态
  */
  // 应用是否不可用
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  // 是否为未知原因导致的不可用
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  // 提示词配置
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  // 应用是否已初始化
  const [inited, setInited] = useState<boolean>(false)
  // 在移动端，通过点击按钮显示侧边栏
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  // 视觉配置（图片上传相关）
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })

  /**
   * 从roles_prompt字符串中提取所有的key值，并将其作为名称返回
   * @param jsonStr - JSON字符串
   * @returns 提取的名称，用'-'连接
   */
  const extractNamesFromJson = (jsonStr: string | undefined | null): string => {
    if (jsonStr == undefined||null||"") {
      return ''
    }
    try {
      const data = JSON.parse(jsonStr)
      const names = Object.keys(data)
      return names.join('-')
    } catch (error) {
      console.error('解析JSON失败:', error)
      return ''
    }
  }

  // 设置页面标题
  useEffect(() => {
    if (APP_INFO?.title)
      document.title = `${APP_INFO.title} - Powered by Dify`
  }, [APP_INFO?.title])

  // 配置immer的自动冻结功能
  // onData change thought (the produce obj). https://github.com/immerjs/immer/issues/576
  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  /*
  * 对话信息相关状态和函数
  */
  const {
    conversationList,           // 对话列表
    setConversationList,        // 设置对话列表
    currConversationId,         // 当前对话ID
    getCurrConversationId,      // 获取当前对话ID
    setCurrConversationId,      // 设置当前对话ID
    getConversationIdFromStorage, // 从存储中获取对话ID
    isNewConversation,          // 是否为新对话
    currConversationInfo,       // 当前对话信息 包括对话名和介绍 不是内框左上角的
    currInputs,                 // 当前输入
    newConversationInputs,      // 新对话输入
    resetNewConversationInputs, // 重置新对话输入
    setCurrInputs,              // 设置当前输入
    setNewConversationInfo,     // 设置新对话信息
    setExistConversationInfo,   // 设置已存在对话信息
  } = useConversation()


//prompt variables
/*
prompt_variables:Array(4)
0: key: "bot_opening_remarks"
max_length: 48
name: "bot_opening_remarks"
options: []
required: false
type: "string"
*/


  console.log('currInputs>>>157', currInputs); //每次发消息 都会有输入的roles_promt model_name这些

  // 对话ID是否因为新建而改变
  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  // 聊天是否已开始
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)
  // 用户选择的模型名称
  const [userModelName, setUserModelName] = useState<string>('')

  /**
   * 处理开始聊天
   * @param inputs - 输入参数
   */
  const handleStartChat = (inputs: Record<string, any>) => {
    // 创建新聊天
    createNewChat()                
    // 标记对话ID因新建而改变  布尔值                                 
    setConversationIdChangeBecauseOfNew(true)  
    // 设置当前输入                      
    setCurrInputs(inputs)       
    // 标记聊天已开始 布尔值                                      
    setChatStarted()                                                 
    // 解析介绍中的变量
    setChatList(generateNewChatListWithOpenStatement('', inputs))     // 生成带开场白的聊天列表
    if ('model_name' in inputs) {
      setUserModelName(inputs['model_name'])                              // 设置用户选择的模型名
    }
  }
  
  // 检查是否已设置输入
  const hasSetInputs = (() => {
    if (!isNewConversation)
      return true

    return isChatStarted
  })()

  // 获取对话名称
  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  
  console.log("conversationName[191]>>>",conversationName)  //每次对话都打印对话名 "新的对话"
  // 获取对话介绍
  const conversationIntroduction = currConversationInfo?.introduction || ''

  //console.log("conversationIntroduction[193]>>>",conversationIntroduction)

  // 【新增】动态生成对话名称
  // 使用已声明的 conversationName 变量

  // 查找标准角色prompt的key


    //console.log('promptConfig?.prompt_variables', promptConfig?.prompt_variables);

  // 动态生成的对话名称
   //const dynamicConversationName = extractNamesFromJson(inputs['roles_prompt']) || conversationName as string

 //const dynamicConversationName = extractNamesFromJson("") || conversationName as string
  /**
   * 处理对话切换
   * 当对话ID或初始化状态改变时触发  比如首轮聊天之后
   */
  const handleConversationSwitch = () => {
    if (!inited)
      return

    // 更新当前对话的输入
    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      // 如果不是新对话，从对话列表中找到对应项
      const item = conversationList.find(item => item.id === currConversationId)
      console.log("handleConversationSwitch[225]>>>",conversationList)
      /*
{id: '6af72377-b632-445d-bf29-94d33805f8a8', name: '表达对我的赞同', inputs: {bot_opening_remarks:"",
know_ids:"",model_name:"SenseChat-Character-Pro-Q"
roles_prompt:"{\n        \"钰瑾\":\n            {\}, status: 'normal', introduction: '',introduction: "",name: "Stating a number"status:"normal"
updated_at: 175101584}
{id: '8e69300b-6630-40e2-b54e-0385d275142a', name: 'sharing a number', inputs: {…}, status: 'normal', introduction: '', 
*/
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        // name: item?.name || '',
        name: conversationName,  // 使用动态生成的名称
        introduction: notSyncToStateIntroduction,
      })

      //console.log('item[235]>>>',item) //就是对话列表中的一项
    }
    else {
      console.log('newConversationInputs[236]>>>',newConversationInputs)
      // 如果是新对话，使用新对话的输入
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    // 更新当前对话的聊天列表
    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
      fetchChatList(currConversationId).then((res: any) => {
        const { data } = res
        const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

        // 遍历历史消息，构建聊天列表
        data.forEach((item: any) => {
          // 添加用户问题
          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],
          })
          // 添加AI回答
          newChatList.push({
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          })
        })
        setChatList(newChatList)
      })
    }

    // 如果是新对话且聊天已开始，生成带开场白的聊天列表
    if (isNewConversation && isChatStarted)
      setChatList(generateNewChatListWithOpenStatement())
  }
  // 监听对话ID和初始化状态变化
  useEffect(handleConversationSwitch, [currConversationId, inited])

  /**
   * 处理对话ID变化
   * @param id - 新的对话ID
   */
  const handleConversationIdChange = (id: string) => {
    if (id === '-1') {
      // 如果ID为-1，表示创建新聊天
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    // 触发handleConversationSwitch
    setCurrConversationId(id, APP_ID)
    hideSidebar()  // 隐藏侧边栏
  }

  /*
  * 聊天信息相关状态。聊天属于对话下的子级。
  */
  // 聊天列表状态
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  // 聊天列表DOM引用，用于滚动控制
  const chatListDomRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到底部
  useEffect(() => {
    // 滚动到底部
    if (chatListDomRef.current)
      chatListDomRef.current.scrollTop = chatListDomRef.current.scrollHeight
  }, [chatList, currConversationId])
  
  // 用户是否可以编辑输入（如果用户已发送消息则不能编辑）
  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  
  /**
   * 创建新聊天
   */
  const createNewChat = () => {
    // 如果新聊天已存在，不创建新聊天
    if (conversationList.some(item => item.id === '-1'))
      return

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
         id: '-1',
         name: t('app.chat.newChatDefaultName'),//这里是点击新对话时的默认对话名 不能改
         inputs: newConversationInputs,
        introduction: conversationIntroduction,
      })
    }))
  }

  /**
   * 生成带开场白的新聊天列表
   * 有时介绍没有应用到状态中
   * @param introduction - 介绍文本
   * @param inputs - 输入参数
   * @returns 聊天项数组
   */
  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null


    console.log('generateNewChatListWithOpenStatement inputs>>>', inputs);  //答应prompts 和 model_name这些 
    console.log('generateNewChatListWithOpenStatement currInputs>>>', inputs);
    //这里在前端页面输入后 就可以显示输入的内容
/*
  {
    "bot_opening_remarks": "",
    "roles_prompt": "{\n        \"钰瑾\":\n            {\"性别\": \"男\",\n             \"身份\": \"摄政王。当朝摄政王\",\n             \"别名\": \"\",\n             \"详细设定\": \"权势滔天，架空皇权，对傀儡皇帝(我)不甚在意，认为我掀不出什么大浪，平日话少，经常只用眼神跟人交流就足够，性格偏执，阴狠暴力，对待不听话的东西从不手软，长相貌美，但钰瑾不认为这是个优点，钰瑾讨厌别人说钰瑾好看，讨厌别人触碰，但很深情，对喜欢的人似乎没有任何脾气，极度重欲\",\n             \"补充设定\": \"\"\n\t\t\t},\n        \"李晟\":\n            {\"性别\": \"男\",\n             \"身份\": \"所谓的当朝皇帝。\",\n             \"别名\": \"晟晟\",\n             \"详细设定\": \"在很多人面前我会表现的威风凌凌，但和钰瑾相处时总会感觉风头受挫，我常常猜不透钰瑾在想什么。\",\n             \"补充设定\": \"沈檀是你的哥哥,张三是你的兄弟\"\n\t\t\t}\n}\n\t",
    "model_name": "SenseChat-Character-Pro-Q",
    "know_ids": ""
}
    */
    // 如果有介绍和提示变量，替换变量值
    if (calculatedIntroduction && calculatedPromptVariables)
      calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables)

    // 创建开场白对象
    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction,
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
    }
    if (calculatedIntroduction)
      return [openStatement]

    return []
  }

  // 应用初始化
  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        // 并行获取对话数据和应用参数
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])
        // 处理当前对话ID
        const { data: conversations, error } = conversationData as { data: ConversationItem[]; error: string }
        if (error) {
          Toast.notify({ type: 'error', message: error })
          throw new Error(error)
          return
        }

        

// 3. 批量修改所有对话名称
const updatedConversations = produce(conversations, (draft: ConversationItem[]) => {
  draft.forEach(conversation => {
    // 生成新名称：model_name + 解析的角色名
    const newName = conversation?.inputs?.model_name+'-'+extractNamesFromJson(conversation?.inputs?.roles_prompt);
    conversation.name = newName;
  });
});


        


        const _conversationId = getConversationIdFromStorage(APP_ID)
        const isNotNewConversation = conversations.some(item => item.id === _conversationId)

        // 获取新对话信息
        // introduction 是后台填写的app描述   
        const { user_input_form, opening_statement: introduction, file_upload, system_parameters }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)

         console.log('extractNamesFromJson[400]',currInputs)
        setNewConversationInfo({
          //name: t('app.chat.newChatDefaultName'),
          name: extractNamesFromJson(currInputs?.roles_prompt),  // 使用动态生成的名称,从currInputs中获取roles_prompt
         
          introduction,
        })

        // 在setPromptConfig调用中添加模型名变量
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)

        /*

user_input_form 参数的处理流程：

1. 通过 /api/parameters 接口获取应用参数，包含 user_input_form
2. 在主组件中调用 userInputsFormToPromptVariables() 将 user_input_form 转换为 prompt_variables
3. 设置到 promptConfig 状态中
4. Welcome 组件根据 promptConfig.prompt_variables 渲染对应的表单控件
5. 支持多种表单类型：文本输入、下拉选择、多行文本、数字、文件上传等
核心的表单渲染代码位于 `index.tsx` 的 renderInputs 函数中。
        */
        setPromptConfig({
          prompt_template: "",//填写角色的prompt
          prompt_variables,
        } as PromptConfig)

        setVisionConfig({
          ...file_upload?.image,
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })

        setConversationList(updatedConversations as ConversationItem[])

        if (isNotNewConversation)
          setCurrConversationId(_conversationId, APP_ID, false)

        setInited(true)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [])








  // AI响应相关状态
  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  // 中止控制器，用于取消请求
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  // 通知函数
  const { notify } = Toast
  
  /**
   * 记录错误日志
   * @param message - 错误消息
   */
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }


  /**
   * 检查是否可以发送消息
   * @returns 是否可以发送
   */
  const checkCanSend = () => {
    // 如果不是新对话，直接允许发送
    if (currConversationId !== '-1')
      return true

    // 如果没有输入或提示词配置，允许发送
    if (!currInputs || !promptConfig?.prompt_variables)
      return true

    // 🔧 修复：只检查必填字段
    const hasEmptyRequiredField = promptConfig.prompt_variables.some(variable => {
      return variable.required && (!currInputs[variable.key] || currInputs[variable.key].trim() === '')
    })

    if (hasEmptyRequiredField) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  // 聊天控制相关状态
  const [controlFocus, setControlFocus] = useState(0)                                                    // 控制焦点
  const [openingSuggestedQuestions, setOpeningSuggestedQuestions] = useState<string[]>([])              // 开场建议问题
  const [messageTaskId, setMessageTaskId] = useState('')                                                // 消息任务ID
  const [hasStopResponded, setHasStopResponded, getHasStopResponded] = useGetState(false)               // 是否已停止响应
  const [isRespondingConIsCurrCon, setIsRespondingConCurrCon, getIsRespondingConIsCurrCon] = useGetState(true)  // 响应的对话是否为当前对话
  const [userQuery, setUserQuery] = useState('')                                                        // 用户查询

  /**
   * 更新当前问答对
   * @param params - 更新参数
   */
  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    // 闭包中的新列表已过时
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId))
          draft.push({ ...questionItem })

        draft.push({ ...responseItem })
      })
    setChatList(newListWithAnswer)
  }

  /**
   * 转换文件为服务器格式
   * @param fileItem - 文件项
   * @returns 服务器文件格式
   */
  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  /**
   * 处理发送消息
   * @param message - 消息内容
   * @param files - 附件文件
   */
  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }
    
    // 准备发送到服务器的输入数据
    const toServerInputs: Record<string, any> = {}
    if (currInputs) {
      Object.keys(currInputs).forEach((key) => {
        const value = currInputs[key]
        if (value.supportFileType)
          toServerInputs[key] = transformToServerFile(value)
        else if (value[0]?.supportFileType)
          toServerInputs[key] = value.map((item: any) => transformToServerFile(item))
        else
          toServerInputs[key] = value
      })
    }

    // 构建请求数据
    const data: Record<string, any> = {
      inputs: toServerInputs,
      query: message,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    // 如果启用了视觉功能且有文件，添加文件数据
    if (visionConfig?.enabled && files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    // 创建问题项
    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      message_files: files,
    }

    // 创建占位符回答项
    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    // 更新聊天列表
    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    let isAgentMode = false  // 是否为代理模式

    // 创建回答项
    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false  // 是否已设置响应ID

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''

    setRespondingTrue()  // 设置为响应中状态
    
    // 发送聊天消息
    sendChatMessage(data, {
      // 获取中止控制器
      getAbortController: (abortController) => {
        setAbortController(abortController)
      },
      // 接收数据回调
      onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        if (!isAgentMode) {
          // 普通模式：直接追加消息内容
          responseItem.content = responseItem.content + message
        }
        else {
          // 代理模式：追加到最后一个思考中
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
          if (lastThought)
            lastThought.thought = lastThought.thought + message // 需要immer setAutoFreeze
        }
        
        // 设置响应ID
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        // 如果是第一条消息且有新对话ID，保存它
        if (isFirstMessage && newConversationId)
          tempNewConversationId = newConversationId

        setMessageTaskId(taskId)
        
        // 检查是否已切换到其他对话
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return
        }
        
        // 更新当前问答对
        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      // 完成回调
      async onCompleted(hasError?: boolean) {
        if (hasError)
          return

        // 如果是因为新建对话而改变ID，生成对话名称
        if (getConversationIdChangeBecauseOfNew()) {
          const { data: allConversations }: any = await fetchConversations()
          //拿到首轮对话的id去做 

          //allConversations[0]
          console.log("allConversations[0]>>>",allConversations[0])
          //const newItem: any = await generationConversationName(allConversations[0].id)
          //const name = allConversations[0]['inputs']['model_name']+"-"+extractNamesFromJson(allConversations[0]['inputs']['roles_prompt']) 
// 3. 批量修改所有对话名称
const updatedConversations = produce(allConversations, (draft: ConversationItem[]) => {
  draft.forEach(conversation => {
    // 生成新名称：model_name + 解析的角色名
    const newName = conversation?.inputs?.model_name+'-'+extractNamesFromJson(conversation?.inputs?.roles_prompt);
    conversation.name = newName;
  });
});

          // const newAllConversations = produce(allConversations, (draft: any) => {
          //   draft[0].name = newItem.name
          // })

          // const newAllConversations = produce(allConversations, (draft: any) => {
          //   draft[0].name = name
          // })
          setConversationList(updatedConversations as any)

         
 


          
        }
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setChatNotStarted()
        setCurrConversationId(tempNewConversationId, APP_ID, true)
        setRespondingFalse()
      },
      // 文件回调
      onFile(file) {
        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought)
          lastThought.message_files = [...(lastThought as any).message_files, { ...file }]

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      // 思考回调（代理模式）
      onThought(thought) {
        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        
        // 处理代理思考
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          // 思考改变但仍是同一个思考，所以更新
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        
        // 检查是否已切换到其他对话
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return false
        }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      // 消息结束回调
      onMessageEnd: (messageEnd) => {
        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
          const newListWithAnswer = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId))
                draft.push({ ...questionItem })

              draft.push({
                ...responseItem,
              })
            })
          setChatList(newListWithAnswer)
          return
        }
        // 不支持显示引用
        // responseItem.citation = messageEnd.retriever_resources
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId))
              draft.push({ ...questionItem })

            draft.push({ ...responseItem })
          })
        setChatList(newListWithAnswer)
      },
      // 消息替换回调
      onMessageReplace: (messageReplace) => {
        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)

            if (current)
              current.content = messageReplace.answer
          },
        ))
      },
      // 错误回调
      onError() {
        setRespondingFalse()
        // 回滚占位符回答
        setChatList(produce(getChatList(), (draft) => {
          draft.splice(draft.findIndex(item => item.id === placeholderAnswerId), 1)
        }))
      },
      // 工作流开始回调
      onWorkflowStarted: ({ workflow_run_id, task_id }) => {
        // taskIdRef.current = task_id
        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      // 工作流完成回调
      onWorkflowFinished: ({ data }) => {
        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      // 节点开始回调
      onNodeStarted: ({ data }) => {
        responseItem.workflowProcess!.tracing!.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      // 节点完成回调
      onNodeFinished: ({ data }) => {
        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
    })
  }

  /**
   * 处理反馈
   * @param messageId - 消息ID
   * @param feedback - 反馈内容
   */
  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) {
        return {
          ...item,
          feedback,
        }
      }
      return item
    })
    setChatList(newChatList)
    notify({ type: 'success', message: t('common.api.success') })
  }

  /**
   * 渲染侧边栏
   * @returns 侧边栏组件或null
   */
  const renderSidebar = () => {
    if (!APP_ID || !APP_INFO || !promptConfig)
      return null
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        currentId={currConversationId}
        copyRight={APP_INFO.copyright || APP_INFO.title}
      />
    )
  }

  // 如果应用不可用，显示不可用页面
  if (appUnavailable)
    return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} />

  // 如果应用未完全加载，显示加载页面
  if (!APP_ID || !APP_INFO || !promptConfig)
    return <Loading type='app' />

  // 渲染主界面
  return (
    <div className='bg-gray-100'>
      {/* 头部组件 */}
      <Header
        title={APP_INFO.title}
        isMobile={isMobile}
        onShowSideBar={showSidebar}
        onCreateNewChat={() => handleConversationIdChange('-1')}
        // 【修改】使用用户输入的模型名，如果没有则使用配置的默认值
        modelName={userModelName || APP_INFO.modelName}
      />
      <div className="flex rounded-t-2xl bg-white overflow-hidden">
        {/* 侧边栏 */}
        {!isMobile && renderSidebar()}
        {/* 移动端侧边栏（模态框形式） */}
        {isMobile && isShowSidebar && (
          <div className='fixed inset-0 z-50'
            style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }}
            onClick={hideSidebar}
          >
            <div className='inline-block' onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </div>
          </div>
        )}
        {/* 主内容区域 */}
        <div className='flex-grow flex flex-col h-[calc(100vh_-_3rem)] overflow-y-auto'>
          {/* 配置场景组件 */}
          <ConfigSence
            // 【修改】使用动态生成的对话名称
            conversationName={extractNamesFromJson(currInputs?.roles_prompt)} //显示在内对话框的左上角的
            hasSetInputs={hasSetInputs}
            isPublicVersion={isShowPrompt}
            siteInfo={APP_INFO}
            promptConfig={promptConfig}
            onStartChat={handleStartChat}
            canEditInputs={canEditInputs}
            savedInputs={currInputs as Record<string, any>}
            onInputsChange={setCurrInputs}
          ></ConfigSence>

          {/* 聊天区域 */}
          {
            hasSetInputs && (
              <div className='relative grow h-[200px] pc:w-[794px] max-w-full mobile:w-full pb-[66px] mx-auto mb-3.5 overflow-hidden'>
                <div className='h-full overflow-y-auto' ref={chatListDomRef}>
                  <Chat
                    chatList={chatList}
                    onSend={handleSend}
                    onFeedback={handleFeedback}
                    isResponding={isResponding}
                    checkCanSend={checkCanSend}
                    visionConfig={visionConfig}
                  />
                </div>
              </div>)
          }
        </div>
      </div>
    </div>
  )
}

// 使用React.memo优化性能，避免不必要的重渲染
export default React.memo(Main)