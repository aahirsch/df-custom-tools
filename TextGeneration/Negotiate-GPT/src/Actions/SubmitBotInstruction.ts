import Conversation from "../Conversation";
import {Action, InvalidJSONForAction} from "./Action";
import ActionKeys from "./ActionKeys";

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

  init(): void {
    return
  }

  do(conversation: Conversation): void {
    conversation.submitInstruction(this.instruction)
  }

}

export default SubmitBotInstruction