import Conversation from "../Conversation";

class InvalidJSONForAction extends Error {

  json: any;
  invalidField: string;

  constructor(json: any, invalidField: string) {
    super("Failed to initialize action with JSON: " + JSON.stringify(json)+"\nInvalid field: "+invalidField+"\n") 

    this.json = json;
    this.invalidField = invalidField;
  }

}

interface Action {

  //clear for new conversation
  init: () => void;

  do: (conversation: Conversation) => void;

}

export default Action

export { Action, InvalidJSONForAction}