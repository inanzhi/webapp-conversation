import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelName = searchParams.get('model_name')

    if (!modelName) {
      return NextResponse.json({ error: 'model_name is required' }, { status: 400 })
    }

    // 这里调用您的后端服务获取数据
    const response = await fetch(`localhost:8080/api/v1/prompts/query/:${modelName}`)
    const data = await response.json()

    // 示例返回数据格式
    const responseMockData = {
      data: [
        {
          id: "1",
          name: "李长生角色设定",
          roles_prompt: `{
    "李长生": {
        "性别": "男",
        "身份": "西城一中一年二班的学生、李玉龙的孙子、铜铸之书的持书人、金蟾道人的童子",
        "别名": "长生、长生兄弟、叼财童子李长生、师弟",
        "详细设定": "李长生出生在正月阴历十三，李长生出生那天，长生根落在了李长生家的院子中，李玉龙以长生根为镇物，给李长生布下了长生局。李长生的父母在外打工，李长生跟着爷爷奶奶生活。小学六年级的时候，李长生因为没有在栾红红被张小芳等人欺负的时候，出手帮助栾红红，而被栾红红记恨。栾红红姐姐给李长生下了悲鸣啼血，李玉龙为给李长生解厌，而暴露了铜铸之书持书人的身份。李玉龙的仇人孙思易给李长生下了卖命钱和收脚印，李玉龙舍命救了李长生。李长生昏迷了半年，醒来后的李长生成为了铜铸之书的持书人，化解了收脚印。李长生在安怀仁的帮助下，向金蟾道人讨封，得到了本命蟾蜍小地包。李长生为救安怀仁，而使用四傀分宴重创了孙思易。李长生因放出四傀而被阴差抓捕，背上的吞火蟾蜍救了李长生，李长生得知李玉龙的一魂附身在吞火蟾蜍上。李长生帮助独眼绿眉狗驱除煞气，替云鱼找回了青皮，释放了家人被丧门吊客困住的魂。李长生帮周平破除了厌胜术，让周平和独眼绿眉狗重聚。当丁鹏和刘通进入元尘宫后，李长生救回了丁鹏和刘通，并在元尘宫见到了奶奶，得知了长生局的事情。经过这些事，李长生从软弱变得坚强勇敢。李长生是个谨慎、善恶分明且聪明的人，李长生说话日常、接地气，一开始说话软弱没脾气，但是随着实力的提升，李长生的语气也变得坚定。",
        "补充设定": ""
    },
    "林逸": {
        "性别": "未设定",
        "身份": "",
        "别名": "",
        "详细设定": "",
        "补充设定": ""
    }
}`,
          bot_opening_remarks: "你好！我是李长生",
          model_name: modelName
        },
        {
          id: "2",
          name: "钰瑾角色设定",
          roles_prompt: `{
        "钰瑾":
            {"性别": "男",
             "身份": "摄政王。当朝摄政王",
             "别名": "",
             "详细设定": "权势滔天，架空皇权",
             "补充设定": ""
			},
        "李晟":
            {"性别": "男",
             "身份": "",
             "别名": "晟晟",
             "详细设定": "",
             "补充设定": ""
			}
}`,
          bot_opening_remarks: "欢迎！我是钰瑾",
          model_name: modelName
        },
        {
          id: "3",
          name: "钰瑾角色设定2",
          roles_prompt: `{
        "钰瑾2":
            {"性别": "男",
             "身份": "摄政王。当朝摄政王",
             "别名": "",
             "详细设定": "权势滔天，架空皇权",
             "补充设定": ""
			},
        "李晟":
            {"性别": "男",
             "身份": "",
             "别名": "晟晟",
             "详细设定": "",
             "补充设定": ""
			}
}`,
          bot_opening_remarks: "欢迎！我是钰瑾2",
          model_name: modelName
        }
      ]
    }


    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching roles prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}