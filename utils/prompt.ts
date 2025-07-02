import type { PromptVariable, UserInputFormItem } from '@/types/app'


//匹配占位符 然后替换为变量值  优先替换inputs中的 没有就用promptVariables中的 否则返回原占位符字符串
export function replaceVarWithValues(str: string, promptVariables: PromptVariable[], inputs: Record<string, any>) {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const name = inputs[key]
    if (name)
      return name

    const valueObj: PromptVariable | undefined = promptVariables.find(v => v.key === key)
    return valueObj ? `{{${valueObj.key}}}` : match
  })
}

/**
 * 从用户输入表单转换为提示变量
 * 输入：接收一个可能为 null 或 UserInputFormItem[] 类型的数组（用户表单输入项）。
 * 输出：返回 PromptVariable[] 数组（标准化后的变量列表），如果输入为 null 则返回空数组。
 * 说明：
 * 1. 函数会根据用户输入项的类型（字符串、段落、数字、文件、文件列表、选择），将其转换为 PromptVariable 类型。
 * 2. 字符串和段落类型的输入项，会转换为 type 为 'string' 的 PromptVariable。
 * 3. 数字类型的输入项，会转换为 type 为 'number' 的 PromptVariable。
 * 4. 文件和文件列表类型的输入项，会转换为 type 为 'file' 或 'file-list' 的 PromptVariable。
 * 5. 选择类型的输入项，会转换为 type 为 'select' 的 PromptVariable，其中 options 字段为输入项的选项数组。
 * 
 * @param useInputs 用户输入表单
 * @returns 提示变量  
 */
export const userInputsFormToPromptVariables = (useInputs: UserInputFormItem[] | null) => {
  if (!useInputs)
    return []
  const promptVariables: PromptVariable[] = []

  //输入 item = { 'text-input': { variable: 'name', label: '姓名' } }  
  //输出[type = 'string'  content = { variable: 'message', label: '留言内容' }]
  useInputs.forEach((item: any) => {
    const [type, content] = (() => {
      const type = Object.keys(item)[0]
      return [type === 'text-input' ? 'string' : type, item[type]]
    })()

    if (type === 'string' || type === 'paragraph') {
      promptVariables.push({
        key: content.variable,
        name: content.label,
        required: content.required,
        type,
        max_length: content.max_length,
        options: [],
      })
    }
    else if (type === 'number') {
      promptVariables.push({
        key: content.variable,
        name: content.label,
        required: content.required,
        type,
        options: [],
      })
    }
    else if (type === 'file' || type === 'file-list') {
      promptVariables.push({
        ...content,
        key: content.variable,
        name: content.label,
        required: content.required,
        type,
        max_length: content.max_length,
        options: [],
      })
    }
    else {
      promptVariables.push({
        key: content.variable,
        name: content.label,
        required: content.required,
        type: 'select',
        options: content.options,
      })
    }
  })
  return promptVariables
}
