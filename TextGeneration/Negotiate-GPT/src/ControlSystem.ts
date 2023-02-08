import {Action, InvalidJSONForAction} from "./Actions/Action"
import CallGPT3 from "./CallGPT3"
import {Condition, InvalidJSONForCondition} from "./Conditions/Condition"
import CompoundCondition from "./Conditions/CompoundCondition"
import Conversation from "./Conversation"

import GetConditionFromJSON from "./Conditions/GetConditionFromJSON"
import GetActionFromJSON from "./Actions/GetActionFromJSON"

class InvalidJSONForControlSystem extends Error{
  constructor(json:any, missingProperty:string){
    super(`Invalid JSON for ControlSystem: missing property ${missingProperty}`)
  }
}

class ControlSystem{

  //excludes compound conditions
  conditions: Array<Condition> = []

  compoundConditions: Array<CompoundCondition> = new Array<CompoundCondition>()

  actions: Array<Action> = []

  controlPairs: Map<Condition, Array<Action>> = new Map<Condition, Array<Action>>()

  public static fromJSON(json:any):ControlSystem{

    const controlSystem = new ControlSystem()

    //Step 1: check for missing properties

    if(json.conditions == undefined){
      throw new InvalidJSONForControlSystem(json, "conditions")
    }

    if(json.actions == undefined){
      throw new InvalidJSONForControlSystem(json, "actions")
    }

    if(json.controlPairs == undefined){
      throw new InvalidJSONForControlSystem(json, "controlPairs")
    }

    //Step 2: import all conditions

    const conditionMap:Map<string, Condition> = new Map<string, Condition>()

    json.conditions.forEach((conditionJSON:any) => {
      const name = conditionJSON.name
      if(name == undefined){
        throw new InvalidJSONForControlSystem(json, "CONDITION.name")
      }

      const condition = GetConditionFromJSON(conditionJSON, CallGPT3)

      conditionMap.set(name, condition)
      controlSystem.registerCondition(condition)

    })

    //Step 3: import all actions

    const actionMap:Map<string, Action> = new Map<string, Action>()


    json.actions.forEach((actionJSON:any) => {
      const name = actionJSON.name
      if(name == undefined){
        throw new InvalidJSONForControlSystem(json, "ACTION.name")
      }

      const action = GetActionFromJSON(actionJSON)
      actionMap.set(name, action)
      controlSystem.actions.push(action)

    })

    //Step 4: import all control pairs

    json.controlPairs.forEach((controlPairJSON:any) => {
      const conditionName = controlPairJSON.condition
      if(conditionName == undefined){
        throw new InvalidJSONForControlSystem(json, "CONTROL_PAIR.condition")
      }
      if(!conditionMap.has(conditionName)){
        throw new InvalidJSONForControlSystem(json, `CONTROL_PAIR.condition ${conditionName}`)
      }
      const condition = conditionMap.get(conditionName)

      const actionName = controlPairJSON.action
      if(actionName == undefined){
        throw new InvalidJSONForControlSystem(json, "CONTROL_PAIR.action")
      }
      if(!actionMap.has(actionName)){
        throw new InvalidJSONForControlSystem(json, `CONTROL_PAIR.action ${actionName}`)
      }
      const action = actionMap.get(actionName)

      controlSystem.addControlPair(condition!, action!)
    })

    //Step 5: init compound conditions

    controlSystem.compoundConditions.forEach((compoundCondition:CompoundCondition) => {
      compoundCondition.initPointers(conditionMap)
    })

    //Step 6: preCompute compound condition execution order

    try{
      controlSystem.compoundConditions = this.computeCompoundConditionExecutionOrder(controlSystem.compoundConditions, conditionMap)
    }
    catch(e){
      if(e instanceof InvalidJSONForCondition){
        e.json = json
        throw e
      }
    }

    return controlSystem
  }


  //O(n^2)
  private static computeCompoundConditionExecutionOrder(
    compoundConditions:Array<CompoundCondition>,
    conditionsMap:Map<string, Condition>
    ):Array<CompoundCondition>{
    //find roots
    const roots:Set<CompoundCondition> = new Set<CompoundCondition>(compoundConditions)

    compoundConditions.forEach((compoundCondition:CompoundCondition) => {
      compoundCondition.getDependencies().forEach((dependency:Condition) => {
        if(dependency.isCompound()){
          roots.delete(dependency as CompoundCondition)
        }
      })
    })

    if(roots.size == 0&&compoundConditions.length>0){
      throw new InvalidJSONForCondition({}, "Compound Conditions are cyclical")
    }

    const executionOrder:Array<CompoundCondition> = []

    const recursiveAdd = (compoundCondition:CompoundCondition) => {
      if(executionOrder.includes(compoundCondition)){
        return
      } 

      compoundCondition.getDependencies().forEach((dependency:Condition) => {
        if(dependency.isCompound()){
          recursiveAdd(dependency as CompoundCondition)
        }
      })
      executionOrder.push(compoundCondition)
    }

    roots.forEach((root:CompoundCondition) => {
      recursiveAdd(root)
    })

    return executionOrder

  }

  private registerCondition(condition:Condition):void{
    if(condition.isCompound()){
      this.compoundConditions.push(condition as CompoundCondition)
    }
    else{
      if(!this.conditions.includes(condition)){
        this.conditions.push(condition)
      }
    }
  }

  public addControlPair(condition:Condition, action:Action):void{
    this.registerCondition(condition)
    if(!this.actions.includes(action)){
      this.actions.push(action)
    }
    
    if(this.controlPairs.has(condition)){
      this.controlPairs.get(condition)!.push(action)
    }
    else{
      this.controlPairs.set(condition, [action])
    }
  }


  private async checkConditions(conversation:Conversation,
    checkCondition:(condition:Condition) => Promise<boolean>,
    checkCompoundCondition:(condition:CompoundCondition, conditionResults: Map<Condition,boolean>) => Promise<boolean>
    ):Promise<any>{

      const conditionResults:Map<Condition, boolean> = new Map<Condition, boolean>()

    //note
    //It is really important that each of the non-compound conditions are checked async
    //this ensures latency = max(latency of each condition)

    //check root conditions
    const promises:Promise<void>[] = []

    for(let i = 0; i < this.conditions.length; i++){
      promises.push((new Promise<void>(async (resolve,reject) => {
        const result = await checkCondition(this.conditions[i])
        conditionResults.set(this.conditions[i], result)
        if(result&&this.controlPairs.has(this.conditions[i])){
          this.controlPairs.get(this.conditions[i])!.forEach((action:Action) => {
            action.do(conversation)
          })
        }
        resolve()})))
    }

    await Promise.all(promises)

    //now all non-compound conditions have been checked

    //check compound conditions in order an in sync
    for(let i = 0; i < this.compoundConditions.length; i++){
      const result = await checkCompoundCondition(this.compoundConditions[i], conditionResults)
      conditionResults.set(this.compoundConditions[i], result)
      if(result){
        this.controlPairs.get(this.compoundConditions[i])!.forEach((action:Action) => {
          action.do(conversation)
        })
      }
    }

  }

  /**
   * onUserMessage checks all the conditions that are set to be check after a user message or after both.
   * 
   * The conditionLastStates are used to determine if persistent and trigger-once conditions should be checked
   * 
   * conditionLastStates will be updated with the new condition states
   *
   * @param {Conversation} conversation - the conversation the conditions should be checked in
   * 
   * @param {Map<Condition,boolean>} conditionLastStates - a map of the last states of each condition used for bypassing persistent and trigger-once conditions (will be modified)
   * 
   * @returns {Promise<any>}
   * 
   */
  public async onUserMessage(conversation:Conversation, conditionLastStates:Map<Condition,boolean>):Promise<any>{

    const conditionCall =  async (condition:Condition) => {
      const result = await condition.afterUserMessageCheck(conversation, conditionLastStates.get(condition))
      conditionLastStates.set(condition, result)
      return result
    }

    const compoundConditionCall = async (condition:CompoundCondition, conditionResults: Map<Condition,boolean>) => {
      const result = await condition.afterUserMessageCheck(
        conversation,
        conditionLastStates.get(condition),
        conditionResults)
      conditionLastStates.set(condition, result)
      return result
    }
    
    await this.checkConditions(conversation, conditionCall, compoundConditionCall) 
  }


  /**
   * onBot checks all the conditions that are set to be check after a bot message or after both.
   * 
   * The conditionLastStates are used to determine if persistent and trigger-once conditions should be checked
   * 
   * conditionLastStates will be updated with the new condition states
   * 
   * @param {Conversation} conversation - the conversation the conditions should be checked in
   * 
   * @param {Map<Condition,boolean>} conditionLastStates - a map of the last states of each condition used for bypassing persistent and trigger-once conditions (will be modified)
   * 
   * @returns {Promise<any>}
   * 
   */
  public async onBotMessage(conversation:Conversation,conditionLastStates:Map<Condition,boolean>):Promise<any>{

    const conditionCall =  async (condition:Condition) =>{ 
      const result = await condition.afterBotMessageCheck(conversation, conditionLastStates.get(condition))
      conditionLastStates.set(condition, result)
      return result
    }

    const compoundConditionCall = async (condition:CompoundCondition, conditionResults: Map<Condition,boolean>) => {
      const result = await condition.afterBotMessageCheck(conversation,
        conditionLastStates.get(condition), 
        conditionResults)
      conditionLastStates.set(condition, result)
      return result
      }

    await this.checkConditions(conversation, conditionCall, compoundConditionCall)
  }

}

export default ControlSystem

export {ControlSystem, InvalidJSONForControlSystem}