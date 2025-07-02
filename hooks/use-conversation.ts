import { useState } from 'react'
import produce from 'immer'
import { useGetState } from 'ahooks'
import type { ConversationItem } from '@/types/app'

const storageConversationIdKey = 'conversationIdInfo'


/**
 * name  instruction
 */
type ConversationInfoType = Omit<ConversationItem, 'inputs' | 'id'>
function useConversation() {
  const [conversationList, setConversationList] = useState<ConversationItem[]>([])

  //useGetState 额外提供了一个 getter 函数（如 getCurrConversationId），可以实时获取最新值，而不会触发重新渲染：
  const [currConversationId, doSetCurrConversationId, getCurrConversationId] = useGetState<string>('-1')
  // when set conversation id, we do not have set appId   把本地的conversationIdInfo: {[appId1]: conversationId1, [appId2]: conversationId2}取出来 设置新信息再保存回去
 //先拿再存
  const setCurrConversationId = (id: string, appId: string, isSetToLocalStroge = true, newConversationName = '') => {
    doSetCurrConversationId(id)
    if (isSetToLocalStroge && id !== '-1') {
      // conversationIdInfo: {[appId1]: conversationId1, [appId2]: conversationId2}
      //本地能拿到值 就json解析 否则就{}
      const conversationIdInfo = globalThis.localStorage?.getItem(storageConversationIdKey) ? JSON.parse(globalThis.localStorage?.getItem(storageConversationIdKey) || '') : {}
      conversationIdInfo[appId] = id

      //JSON.stringify编码为json格式
      globalThis.localStorage?.setItem(storageConversationIdKey, JSON.stringify(conversationIdInfo))
    }
  }

  const getConversationIdFromStorage = (appId: string) => {
    const conversationIdInfo = globalThis.localStorage?.getItem(storageConversationIdKey) ? JSON.parse(globalThis.localStorage?.getItem(storageConversationIdKey) || '') : {}
    const id = conversationIdInfo[appId]
    return id
  }


  //当前对话id是-1 则是新对话 
  const isNewConversation = currConversationId === '-1'
  // 设置新对话输入内容
  const [newConversationInputs, setNewConversationInputs] = useState<Record<string, any> | null>(null)
  //不是新对话输入 直接返回
  const resetNewConversationInputs = () => {
    if (!newConversationInputs)
      return
  //Immer 中的功能 将不可变对象变成草稿来编辑  不会覆盖源对象 只是返回新对象   未变的部分会引用源对象  如果源对象的某些部分在新状态中仍被引用，那么这些部分不会被垃圾回收
    // 相对于清空了新对话输入键值对中的json中的值  
  setNewConversationInputs(produce(newConversationInputs, (draft) => {
      Object.keys(draft).forEach((key) => {
        draft[key] = ''
      })
    }))
  }
  
  const [existConversationInputs, setExistConversationInputs] = useState<Record<string, any> | null>(null)

  //当前输入 是新对话则从新对话输入中获取 否则从旧对话输入中获取
  const currInputs = isNewConversation ? newConversationInputs : existConversationInputs
  const setCurrInputs = isNewConversation ? setNewConversationInputs : setExistConversationInputs

  // info is muted
  const [newConversationInfo, setNewConversationInfo] = useState<ConversationInfoType | null>(null)
  const [existConversationInfo, setExistConversationInfo] = useState<ConversationInfoType | null>(null)
  const currConversationInfo = isNewConversation ? newConversationInfo : existConversationInfo

  return {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currInputs,
    newConversationInputs,
    existConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    currConversationInfo,
    setNewConversationInfo,
    setExistConversationInfo,
  }
}

export default useConversation
