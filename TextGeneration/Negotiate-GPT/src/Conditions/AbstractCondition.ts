import Conversation from "../Conversation";
import Condition, { InvalidJSONForCondition } from "./Condition";


enum CheckOn{
  AfterUserMessage,
  AfterBotMessage,
  Both
}

abstract class AbstractCondition implements Condition{

  private persistent: boolean = false;
  private triggerOnce: boolean = false;

  private checkOn: CheckOn;

  constructor(checkOn: CheckOn){
    this.checkOn = checkOn;
  }

  /**
   * sets up the CheckOn term and adds the persistent and triggerOnce terms if they are present 
   * 
   * @param json the JSON to parse
   */
  protected fromJSON(json: any) {
    if(json.checkOn===undefined){
      throw new InvalidJSONForCondition(json, "checkOn");
    }

    switch (json.checkOn) {
      case "AfterUserMessage":
        this.checkOn = CheckOn.AfterUserMessage;
        break;
      case "AfterBotMessage":
        this.checkOn = CheckOn.AfterBotMessage;
        break;
      case "Both":
        this.checkOn = CheckOn.Both;
        break;
      default:
        throw new InvalidJSONForCondition(json, "checkOn");
    }

    if(json.persistent==undefined||typeof json.persistent!=="boolean"){
      this.persistent=false
    }
    else{
      this.persistent = json.persistent;
    }

    if(json.triggerOnce==undefined||typeof json.triggerOnce!=="boolean"){
      this.triggerOnce=false
    }
    else{
      this.triggerOnce = json.triggerOnce;
      if(this.triggerOnce){
        this.persistent = true;
      }
    }
    
  }

  /**
   * Checks if the condition check should be skipped and if so what the state should be
   * 
   * @param lastState the last state of the condition
   * 
   * @returns {override:boolean, state:boolean} - override: if the condition check should be skipped, state: the state the condition should be in
   * 
   */
  protected checkPersistenceCondition(lastState:boolean|undefined): {override:boolean, state:boolean} {
    if(this.persistent&&lastState){
      return {override: true, state: this.triggerOnce};
    }
    return {override: false, state: false};
  }

  protected abstract check(conversation: Conversation, ...args: any[]):  Promise<boolean>;

  
  public afterUserMessageCheck(conversation: Conversation, lastState:boolean|undefined, ...args: any[]):  Promise<boolean>{
    if(this.persistent&&lastState){
      return Promise.resolve(!this.triggerOnce);
    }
    //else
    if(this.checkOn===CheckOn.AfterBotMessage){
      return Promise.resolve(false);
    }
    const state = this.check(conversation, ...args);
    if(this.persistent){
      state.then((result)=>{lastState = result})
    }
    return state;
  }

  
  public afterBotMessageCheck(conversation: Conversation, lastState:boolean|undefined, ...args: any[]):  Promise<boolean>{
    if(this.persistent&&lastState){
      return Promise.resolve(!this.triggerOnce);
    }
    //else
    if(this.checkOn===CheckOn.AfterUserMessage){
      return Promise.resolve(false);
    }
    const state = this.check(conversation, ...args);
    state.then((result)=>{lastState = result})
    return state;
  }
  
  
  public isCompound(): boolean {
    return false;
  }

}

export default AbstractCondition

export { AbstractCondition, CheckOn}