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

  private lastState: boolean|undefined = undefined;

  constructor(checkOn: CheckOn){
    this.checkOn = checkOn;
  }

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

  public init(): void{
    if(this.persistent){
      this.lastState = false;
    }
  }

  //NOTE the last state should not be used by compound conditions
  protected getLastState(): boolean|undefined {
    return this.lastState;
  }

  protected setLastState(state: boolean): void {
    this.lastState = state;
  }

  //NOTE the last state should not be changed if persistenceCondition is met
  protected checkPersistenceCondition(): {override:boolean, state:boolean} {
    if(this.persistent&&this.lastState){
      return {override: true, state: this.triggerOnce};
    }
    return {override: false, state: false};
  }

  protected abstract check(conversation: Conversation, ...args: any[]):  Promise<boolean>;

  public afterUserMessageCheck(conversation: Conversation, ...args: any[]):  Promise<boolean>{
    if(this.persistent&&this.lastState){
      return Promise.resolve(!this.triggerOnce);
    }
    //else
    if(this.checkOn===CheckOn.AfterBotMessage){
      return Promise.resolve(false);
    }
    const state = this.check(conversation, ...args);
    if(this.persistent){
      state.then((result)=>{this.lastState = result})
    }
    return state;
  }

  public afterBotMessageCheck(conversation: Conversation, ...args: any[]):  Promise<boolean>{
    if(this.persistent&&this.lastState){
      return Promise.resolve(!this.triggerOnce);
    }
    //else
    if(this.checkOn===CheckOn.AfterUserMessage){
      return Promise.resolve(false);
    }
    const state = this.check(conversation, ...args);
    state.then((result)=>{this.lastState = result})
    return state;
  }
  
  public isCompound(): boolean {
    return false;
  }

}

export default AbstractCondition

export { AbstractCondition, CheckOn}