'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TemplateVarPanel, { PanelTitle, VarOpBtnGroup } from '../value-panel'
import FileUploaderInAttachmentWrapper from '../base/file-uploader-in-attachment'
import s from './style.module.css'
import { AppInfoComp, ChatBtn, EditBtn, FootLogo, PromptTemplate } from './massive-component'
import type { AppInfo, PromptConfig, RolesInfosItem} from '@/types/app'
import Toast from '@/app/components/base/toast'
import Select from '@/app/components/base/select'
import { DEFAULT_VALUE_MAX_LEN } from '@/config'

import { fetchRolesInfos } from '@/service'

// regex to match the {{}} and replace it with a span
const regex = /\{\{([^}]+)\}\}/g

export type IWelcomeProps = {
  conversationName: string
  hasSetInputs: boolean
  isPublicVersion: boolean
  siteInfo: AppInfo
  promptConfig: PromptConfig
  onStartChat: (inputs: Record<string, any>) => void
  canEditInputs: boolean
  savedInputs: Record<string, any>
  onInputsChange: (inputs: Record<string, any>) => void
}

const Welcome: FC<IWelcomeProps> = ({
  conversationName,
  hasSetInputs,
  isPublicVersion,
  siteInfo,
  promptConfig,
  onStartChat,
  canEditInputs,
  savedInputs,
  onInputsChange,
}) => {
  console.log(promptConfig)
  const { t } = useTranslation()
  const hasVar = promptConfig.prompt_variables.length > 0
  const [isFold, setIsFold] = useState<boolean>(true)
  const [inputs, setInputs] = useState<Record<string, any>>((() => {
    if (hasSetInputs)
      return savedInputs

    const res: Record<string, any> = {}
    if (promptConfig) {
      promptConfig.prompt_variables.forEach((item) => {
        res[item.key] = ''
      })
    }
    return res
  })())

 // 为了roles_prompt添加这些缺失的状态变量 
  const [rolesPromptOptions, setRolesPromptOptions] = useState<RolesInfosItem[]>([])
  const [rolesPromptLoading, setRolesPromptLoading] = useState(false)
  const [currentModelName, setCurrentModelName] = useState('')
  //添加结束


   // 新增：从加载的角色列表中 搜索具体角色
  const [roleSearchText, setRoleSearchText] = useState('')
  const [filteredRolesOptions, setFilteredRolesOptions] = useState<RolesInfosItem[]>([])
  //添加结束

  useEffect(() => {
    if (!savedInputs) {
      const res: Record<string, any> = {}
      if (promptConfig) {
        promptConfig.prompt_variables.forEach((item) => {
          res[item.key] = ''
        })
      }
      setInputs(res)
    }
    else {
      setInputs(savedInputs)
    }
  }, [savedInputs])

// 新增：角色搜索过滤逻辑
useEffect(() => {
  if (roleSearchText.trim() === '') {
    setFilteredRolesOptions(rolesPromptOptions)
  } else {
    const filtered = rolesPromptOptions.filter(option => 
      option.name.toLowerCase().includes(roleSearchText.toLowerCase())
    )
    setFilteredRolesOptions(filtered)
  }
}, [roleSearchText, rolesPromptOptions])

//新增结束

//新增监听model_name变化 自动调用API来获取对应的角色信息

useEffect(() => {
  const modelName = inputs?.['model_name']
  if (modelName && modelName.trim() !== '') {
    setRolesPromptLoading(true)
    fetchRolesInfos(modelName)
      .then((response:any) => {
        if (response.data && Array.isArray(response.data)) {
          setRolesPromptOptions(response.data)
        } else {
          setRolesPromptOptions([])
        }
      })
      .catch((error) => {
        console.error('获取角色信息失败:', error)
        setRolesPromptOptions([])
        logError('获取角色信息失败，请重试')
      })
      .finally(() => {
        setRolesPromptLoading(false)
      })
  } else {
    // 如果没有模型名，清空角色选项
    setRolesPromptOptions([])
  }
}, [inputs?.['model_name']]) // 监听model_name的变


  const highLightPromoptTemplate = (() => {
    if (!promptConfig)
      return ''
    const res = promptConfig.prompt_template.replace(regex, (match, p1) => {
      return `<span class='text-gray-800 font-bold'>${inputs?.[p1] ? inputs?.[p1] : match}</span>`
    })
    return res
  })()

  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const renderHeader = () => {
    return (
      <div className='absolute top-0 left-0 right-0 flex items-center justify-between border-b border-gray-100 mobile:h-12 tablet:h-16 px-8 bg-white'>
        <div className='text-gray-900'>{conversationName}</div>
      </div>
    )
  }

  const renderInputs = () => {
    return (
      <div className='space-y-3'>
        {promptConfig.prompt_variables.map(item => (
          <div className='tablet:flex items-start mobile:space-y-2 tablet:space-y-0 mobile:text-xs tablet:text-sm' key={item.key}>
            <label className={`flex-shrink-0 flex items-center tablet:leading-9 mobile:text-gray-700 tablet:text-gray-900 mobile:font-medium pc:font-normal ${s.formLabel}`}>{item.name}</label>
            

{/* 特殊处理 roles_prompt 字段 */}
{item.key === 'roles_prompt' && (
  <div className='w-full space-y-2'>
    {/* 搜索输入框 */}
    <input
      type="text"
      className='w-full py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50 border border-gray-300'
      placeholder="搜索预设角色..."
      value={roleSearchText}
      onChange={(e) => setRoleSearchText(e.target.value)}
    />
    
    {/* 搜索结果列表 - 只在搜索时显示 */}
    {roleSearchText && (
      <div>
        {filteredRolesOptions.length > 0 ? (
          <div className='max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white'>
            {filteredRolesOptions.map((option, index) => (
              <div
                key={`${option.name}-${index}`}
                className='px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0'
                onClick={() => {
                  setInputs({
                    ...inputs,
                    [item.key]: option.roles_prompt,
                    'bot_opening_remarks': option.bot_opening_remarks || ''
                  })
                  // 选择后清空搜索框
                  setRoleSearchText('')
                }}
              >
                <div className='font-medium text-gray-900'>{option.name}</div>
                {option.roles_prompt && (
                  <div className='text-xs text-gray-500 mt-1 truncate'>
                    {option.roles_prompt.substring(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='text-xs text-gray-500 py-2'>
            未找到匹配的角色
          </div>
        )}
        <div className='text-xs text-gray-500 mt-1'>
          找到 {filteredRolesOptions.length} 个匹配的角色
        </div>
      </div>
    )}
    
    {/* 默认的select下拉框 - 不搜索时显示 */}
    {!roleSearchText && (
      <select
        className='w-full py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50 border border-gray-300'
        value=""
        onChange={(e) => {
          if (e.target.value) {
            const selectedOption = rolesPromptOptions.find(option => option.name === e.target.value)
            if (selectedOption) {
              setInputs({
                ...inputs,
                [item.key]: selectedOption.roles_prompt,
                'bot_opening_remarks': selectedOption.bot_opening_remarks || ''
              })
            }
          }
        }}
        disabled={rolesPromptLoading}
      >
        <option value=''>选择预设角色...</option>
        {rolesPromptOptions.map((option, index) => (
          <option key={`${option.name}-${index}`} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
    )}
    
      <textarea
      className="w-full h-[200px] flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50"
      placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
      value={inputs?.[item.key] || ''}
      onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
    />
    {rolesPromptLoading && (
      <div className='text-sm text-gray-500'>加载预设角色中...</div>
    )}
  </div>
)}

          {/* 特殊处理 bot_opening_remarks 字段 */}
          {item.key === 'bot_opening_remarks' && (
            <div className='w-full'>
              <textarea
                className="w-full h-[104px] flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50"
                placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''} - 选择角色预设时自动填充`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
              />
            </div>
          )}
          
          {/* 原有的类型判断，需要排除 roles_prompt 和 bot_opening_remarks */}
          {item.key !== 'roles_prompt' && item.key !== 'bot_opening_remarks' && item.type === 'select' && (
            <Select
              className='w-full'
              defaultValue={inputs?.[item.key]}
              onSelect={(i) => { setInputs({ ...inputs, [item.key]: i.value }) }}
              items={(item.options || []).map(i => ({ name: i, value: i }))}
              allowSearch={false}
              bgClassName='bg-gray-50'
            />
          )}
          {item.key !== 'roles_prompt' && item.key !== 'bot_opening_remarks' && item.type === 'string' && (
            <input
              placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
              value={inputs?.[item.key] || ''}
              onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
              className={'w-full flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50'}
              maxLength={item.max_length || DEFAULT_VALUE_MAX_LEN}
            />
          )}
          {item.key !== 'roles_prompt' && item.key !== 'bot_opening_remarks' && item.type === 'paragraph' && (
            <textarea
              className="w-full h-[104px] flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50"
              placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
              value={inputs?.[item.key] || ''}
              onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
            />
          )}



           { /*结束处理roles_prompt和bot_opening_remarks处理 */}
            
            
            
            {/* {item.type === 'select'
              && (
                <Select
                  className='w-full'
                  defaultValue={inputs?.[item.key]}
                  onSelect={(i) => { setInputs({ ...inputs, [item.key]: i.value }) }}
                  items={(item.options || []).map(i => ({ name: i, value: i }))}
                  allowSearch={false}
                  bgClassName='bg-gray-50'
                />
              )}
            {item.type === 'string' && (
              <input
                placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
                className={'w-full flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50'}
                maxLength={item.max_length || DEFAULT_VALUE_MAX_LEN}
              />
            )}
            {item.type === 'paragraph' && (
              <textarea
                className="w-full h-[104px] flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50"
                placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
              />
            )}
            {item.type === 'number' && (
              <input
                type="number"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 "
                placeholder={`${item.name}${!item.required ? `(${t('appDebug.variableTable.optional')})` : ''}`}
                value={inputs[item.key]}
                onChange={(e) => { onInputsChange({ ...inputs, [item.key]: e.target.value }) }}
              />
            )} */}

            {
              item.type === 'file' && (
                <FileUploaderInAttachmentWrapper
                  fileConfig={{
                    allowed_file_types: item.allowed_file_types,
                    allowed_file_extensions: item.allowed_file_extensions,
                    allowed_file_upload_methods: item.allowed_file_upload_methods!,
                    number_limits: 1,
                    fileUploadConfig: {} as any,
                  }}
                  onChange={(files) => {
                    setInputs({ ...inputs, [item.key]: files[0] })
                  }}
                  value={inputs?.[item.key] || []}
                />
              )
            }
            {
              item.type === 'file-list' && (
                <FileUploaderInAttachmentWrapper
                  fileConfig={{
                    allowed_file_types: item.allowed_file_types,
                    allowed_file_extensions: item.allowed_file_extensions,
                    allowed_file_upload_methods: item.allowed_file_upload_methods!,
                    number_limits: item.max_length,
                    fileUploadConfig: {} as any,
                  }}
                  onChange={(files) => {
                    setInputs({ ...inputs, [item.key]: files })
                  }}
                  value={inputs?.[item.key] || []}
                />
              )
            }
          </div>
        ))}
      </div>
    )
  }

  // const canChat = () => {
  //   const inputLens = Object.values(inputs).length
  //   const promptVariablesLens = promptConfig.prompt_variables.length
  //   const emptyInput = inputLens < promptVariablesLens || Object.values(inputs).filter(v => v === '').length > 0
  //   if (emptyInput) {
  //     logError(t('app.errorMessage.valueOfVarRequired'))
  //     return false
  //   }
  //   return true
  // }

    const canChat = () => {


    
/*
prompt variables

prompt_variables:Array(4)
0: key: "bot_opening_remarks"
max_length: 48
name: "bot_opening_remarks"
options: []
required: false
type: "string"
*/

  // 🔧 修复：只检查必填字段
  const hasEmptyRequiredField = promptConfig.prompt_variables.some(variable => {
    return variable.required && (!inputs[variable.key] || inputs[variable.key].trim() === '')
  })
  
  if (hasEmptyRequiredField) {
    logError(t('app.errorMessage.valueOfVarRequired'))
    return false
  }
  return true
}

  const handleChat = () => {
    if (!canChat())
      return

    //在填写完roles_prompt和model_name后  聊天之前会打印填入的信息
    console.log("handleChat inputs",inputs)
    onStartChat(inputs)
  }

  const renderNoVarPanel = () => {
    if (isPublicVersion) {
      return (
        <div>
          <AppInfoComp siteInfo={siteInfo} />
          <TemplateVarPanel
            isFold={false}
            header={
              <>
                <PanelTitle
                  title={t('app.chat.publicPromptConfigTitle')}
                  className='mb-1'
                />
                <PromptTemplate html={highLightPromoptTemplate} />
              </>
            }
          >
            <ChatBtn onClick={handleChat} />
          </TemplateVarPanel>
        </div>
      )
    }
    // private version
    return (
      <TemplateVarPanel
        isFold={false}
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        <ChatBtn onClick={handleChat} />
      </TemplateVarPanel>
    )
  }

  const renderVarPanel = () => {
    return (
      <TemplateVarPanel
        isFold={false}
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        {renderInputs()}
        <ChatBtn
          className='mt-3 mobile:ml-0 tablet:ml-[128px]'
          onClick={handleChat}
        />
      </TemplateVarPanel>
    )
  }

  const renderVarOpBtnGroup = () => {
    return (
      <VarOpBtnGroup
        onConfirm={() => {
          if (!canChat())
            return

          onInputsChange(inputs)
          setIsFold(true)
        }}
        onCancel={() => {
          setInputs(savedInputs)
          setIsFold(true)
        }}
      />
    )
  }

  const renderHasSetInputsPublic = () => {
    if (!canEditInputs) {
      return (
        <TemplateVarPanel
          isFold={false}
          header={
            <>
              <PanelTitle
                title={t('app.chat.publicPromptConfigTitle')}
                className='mb-1'
              />
              <PromptTemplate html={highLightPromoptTemplate} />
            </>
          }
        />
      )
    }

    return (
      <TemplateVarPanel
        isFold={isFold}
        header={
          <>
            <PanelTitle
              title={t('app.chat.publicPromptConfigTitle')}
              className='mb-1'
            />
            <PromptTemplate html={highLightPromoptTemplate} />
            {isFold && (
              <div className='flex items-center justify-between mt-3 border-t border-indigo-100 pt-4 text-xs text-indigo-600'>
                <span className='text-gray-700'>{t('app.chat.configStatusDes')}</span>
                <EditBtn onClick={() => setIsFold(false)} />
              </div>
            )}
          </>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )
  }

  const renderHasSetInputsPrivate = () => {
    if (!canEditInputs || !hasVar)
      return null

    return (
      <TemplateVarPanel
        isFold={isFold}
        header={
          <div className='flex items-center justify-between text-indigo-600'>
            <PanelTitle
              title={!isFold ? t('app.chat.privatePromptConfigTitle') : t('app.chat.configStatusDes')}
            />
            {isFold && (
              <EditBtn onClick={() => setIsFold(false)} />
            )}
          </div>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )
  }

  const renderHasSetInputs = () => {
    if ((!isPublicVersion && !canEditInputs) || !hasVar)
      return null

    return (
      <div
        className='pt-[88px] mb-5'
      >
        {isPublicVersion ? renderHasSetInputsPublic() : renderHasSetInputsPrivate()}
      </div>)
  }

  return (
    <div className='relative mobile:min-h-[48px] tablet:min-h-[64px]'>
      {hasSetInputs && renderHeader()}
      <div className='mx-auto pc:w-[794px] max-w-full mobile:w-full px-3.5'>
              {/*  Has't set inputs  */}
        {
          !hasSetInputs && (
            <div className='mobile:pt-[32px] tablet:pt-[48px] pc:pt-[80px]'>
              {hasVar
                ? (
                  renderVarPanel()
                )
                : (
                  renderNoVarPanel()
                )}
            </div>
          )
        }

        {/* Has set inputs */}
        {hasSetInputs && renderHasSetInputs()}

        {/* foot */}
        {!hasSetInputs && (
          <div className='mt-4 flex justify-between items-center h-8 text-xs text-gray-400'>

            {siteInfo.privacy_policy
              ? <div>{t('app.chat.privacyPolicyLeft')}
                <a
                  className='text-gray-500'
                  href={siteInfo.privacy_policy}
                  target='_blank'>{t('app.chat.privacyPolicyMiddle')}</a>
                {t('app.chat.privacyPolicyRight')}
              </div>
              : <div>
              </div>}
            <a className='flex items-center pr-3 space-x-3' href="https://dify.ai/" target="_blank">
              <span className='uppercase'>{t('app.chat.powerBy')}</span>
              <FootLogo />
            </a>
          </div>
        )}
      </div>
    </div >
  )
}

export default React.memo(Welcome)
