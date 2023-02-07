import Conversation from "../Conversation";
import AbstractCompoundCondition from "./AbstractCompoundCondition";
import Condition from "./Condition";

class Or extends AbstractCompoundCondition {

   protected check(conversation: Conversation, dependencyResults: Map<Condition, boolean>): Promise<boolean> {
    this.checkInitialized();
    return Promise.resolve(this.conditions!.some(condition => dependencyResults.get(condition)))
  }

  public static fromJSON(json: any): Or {
    const out = new Or([]);

    out.fromJSON(json);

    return out;
  }
}

export default Or