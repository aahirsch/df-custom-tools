import Conversation from "../Conversation";

class InvalidJSONForCondition extends Error {

  json: any;
  invalidField: string;
  
  constructor(json: any, invalidField: string) {
    super("Failed to initialize condition with JSON: " + JSON.stringify(json)+"\nInvalid field: "+invalidField+"\n")

    this.json = json;
    this.invalidField = invalidField;

  }



}

interface Condition {

  /**
   * Checks the condition is triggered. This is called after the user message is processed.
   * 
   * @param conversation the conversation to check the condition for
   * 
   * @param lastState the last state of the condition
   * 
   * @param args
   * 
   */
  afterUserMessageCheck: (conversation: Conversation, lastState: boolean|undefined, ...args:any[]) => Promise<boolean>;

  /**
   * Checks the condition is triggered. This is called after the bot message is processed.
   * 
   * @param conversation the conversation to check the condition for
   * 
   * @param lastState the last state of the condition
   * 
   * @param args
   * 
   */
  afterBotMessageCheck: (conversation: Conversation, lastState:boolean|undefined, ...args:any[]) => Promise<boolean>;

  /**
   * 
   * @returns true if the condition is a compound condition, false otherwise
   */
  isCompound: () => boolean;

}

export default Condition

export { Condition, InvalidJSONForCondition}