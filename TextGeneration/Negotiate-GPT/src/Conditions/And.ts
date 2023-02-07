import Conversation from '../Conversation';
import AbstractCompoundCondition from './AbstractCompoundCondition';
import Condition from './Condition';

class And extends AbstractCompoundCondition {

   protected check(conversation: Conversation, dependencyResults: Map<Condition, boolean>): Promise<boolean> {
    this.checkInitialized();
    return Promise.resolve(this.conditions!.every(condition => dependencyResults.get(condition)))
  }

  public static fromJSON(json: any): And {
    const out = new And([]);

    out.fromJSON(json);

    return out;
  }
 
}

export default And