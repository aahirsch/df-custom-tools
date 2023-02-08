import Conversation from "../Conversation";
import {Action, InvalidJSONForAction} from "./Action";

class SubmitBotInstruction implements Action{

  instruction: string;

  static fromJSON(json: any): SubmitBotInstruction {
    if (json.instruction === undefined) {
      throw new InvalidJSONForAction(json, "instruction")
    }
    return new SubmitBotInstruction(json.instruction)
  }

  constructor(instruction: string) {
    this.instruction = instruction;
  }

  do(conversation: Conversation): void {
    conversation.submitInstruction(this.instruction)
  }

}

export default SubmitBotInstruction