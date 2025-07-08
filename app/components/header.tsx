import React, { FC } from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
export type IHeaderProps = {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  // 【新增】模型名称属性
  modelName?: string
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
  // 【新增】模型名称参数
  modelName,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-gray-100">
      {isMobile
        ? (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-gray-500" />
          </div>
        )
        : <div></div>}
      <div className='flex items-center space-x-2'>
        <AppIcon size="small" />
        <div className=" text-sm text-gray-800 font-bold">{title}</div>
        {/* 【新增】显示模型名称 */}
        {modelName && (
          <div className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
            模型: {modelName}
          </div>
        )}
      </div>
      {/* 只在移动端显示新对话按钮 */}
      {isMobile && (
        <div className='flex items-center justify-center h-8 w-8 cursor-pointer'
          onClick={() => onCreateNewChat?.()}
        >
          <PencilSquareIcon className="h-4 w-4 text-gray-500" />
        </div>
      )}
      {/* 桌面端右侧留空 */}
      {!isMobile && <div></div>}
    </div>
  )
}

export default React.memo(Header)
