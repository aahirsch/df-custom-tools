import Action from "./Action"
import Condition from "./Condition"
import Conversation from "./Conversation"

class ControlSystem{

  conditions: Array<Condition> = []

  actions: Array<Action> = []

  controlPairs: Map<Condition, Array<Action>> = new Map<Condition, Array<Action>>()

  addControlPair(condition:Condition, action:Action):void{
      
    if(!this.actions.includes(action)){
      this.actions.push(action)
    }
    
    if(!this.controlPairs.has(condition)){
      this.controlPairs.get(condition)!.push(action)
    }
    else{
      this.conditions.push(condition)
      this.controlPairs.set(condition, [action])
    }
  }


  init():void{
    this.conditions.forEach((condition:Condition) => {
      condition.init()
    })
    this.actions.forEach((action:Action) => {
      action.init()
    })
  }

  async onUserMessage(conversation:Conversation):Promise<any>{
    //make sure all conditions are fully checked before returning
    const promises:Promise<void>[]=[]

    this.conditions.forEach(async (condition:Condition) => {
      promises.push(new Promise<void>(async (resolve, reject) => {
        if(await condition.afterUserMessageCheck(conversation)){
          this.controlPairs.get(condition)!.forEach((action:Action) => {
            action.do(conversation)
         })
        }
      }))
    })

    return Promise.all(promises)
  }

  async onBotMessage(conversation:Conversation):Promise<any>{
    //make sure all conditions are fully checked before returning
    const promises:Promise<void>[]=[]

    this.conditions.forEach(async (condition:Condition) => {
      promises.push(new Promise<void>(async (resolve, reject) => {
        if(await condition.afterBotMessageCheck(conversation)){
          this.controlPairs.get(condition)!.forEach((action:Action) => {
            action.do(conversation)
         })
        }
      }))
    })

    return Promise.all(promises)
  }

}

export default ControlSystem