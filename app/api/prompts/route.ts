import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelName = searchParams.get('model_name')
    
    if (!modelName) {
      return NextResponse.json({ error: 'model_name is required' }, { status: 400 })
    }

    // 调用您的真实后端服务获取数据
    const response = await fetch(`http://localhost:8080/api/v1/prompts/query/${modelName}`)

    if (!response.ok) {
      // 如果后端服务返回错误，将错误信息透传给前端
      const errorData = await response.text()
      return NextResponse.json({ error: `Backend error: ${errorData}` }, { status: response.status })
    }
   
    const data = await response.json()

//     const mockData ={
//     data:[{
//         "id": 60,
//         "name": "RM-祝放-赵培森_002",
//         "roles_prompt": "{\"祝放\":{\"性别\":\"女\",\n\"身份\":\"同学\",\n\"别名\":\"小祝\",\n\"详细设定\":\"是一个内向、细腻的女孩子，对事情思考很深入。她在乎细节，喜欢安静的活动，如阅读和绘画\",\n\"补充设定\":\"\"},\n\n\"赵培森\":{\"性别\":\"男\",\n\"身份\":\"学生，同学\",\n\"别名\":\"森\",\n\"详细设定\":\"外向、乐观的年轻人，总是充满活力和热情。他喜欢结交新的朋友，善于沟通，喜欢尝试新的事物\",\n\"补充设定\":\"\"}}",
//         "bot_opening_remarks": "（祝放低着头，一副闷闷不乐的样子）",
//         "model_name": "SenseChat-Character-Pro-Q"
//     },
//     {
//         "id": 62,
//         "name": "RM-芸汐-卡拉美",
//         "roles_prompt": "{\"芸汐\":{\"性别\":\"女\",\n\"身份\":\"修炼者\",\n\"别名\":\"\",\n\"详细设定\":\"16岁丧父，芸汐秉承父母严谨公正的性格，身为家中长女独自撑起一个家。芸汐性格坚韧，聪明善良，困难的境遇并没有将芸汐打倒。芸汐与爱人江洲因种种遭遇误会而积怨颇深，但误会解开后，芸汐发现江洲一直默默地守护着芸汐。最终，芸汐与江洲恩重新携手，勇敢地让爱恨成全了芸汐们传奇的人生。\",\n\"补充设定\":\"\"},\"卡拉美\":{\"性别\":\"男\",\n\"身份\":\"师父\",\n\"别名\":\"\",\n\"详细设定\":\"芸汐的师傅。在芸汐16岁时，因为父亲被朝中武将陷害战役失败，最终在战场上受伤身亡。芸汐希望接父亲回家，在前往千里之外战场时遇到洪水，导被冲到了世外桃源，我在修炼之地遇到了芸汐，我的任务是传授给芸汐权谋之计和失传多年的江湖绝技，帮助芸汐在困境中不断战胜困难。\",\n\"补充设定\":\"\"}}",
//         "bot_opening_remarks": "",
//         "model_name": "SenseChat-Character-Pro-Q"
//     }
//   ]
// }
    
    // 将从真实后端获取的数据返回给前端
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching roles prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}