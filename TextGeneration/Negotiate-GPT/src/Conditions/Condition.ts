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

  //clear for new conversation
  init: () => void;

  afterUserMessageCheck: (conversation: Conversation, ...args:any[]) => Promise<boolean>;

  afterBotMessageCheck: (conversation: Conversation, ...args:any[]) => Promise<boolean>;

  isCompound: () => boolean;

}

export default Condition

export { Condition, InvalidJSONForCondition}