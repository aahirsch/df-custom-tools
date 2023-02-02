import Conversation from '../Conversation';
import AbstractCondition, { CheckOn } from './AbstractCondition';
import CompoundCondition, { CompoundConditionFailedToInitialize, CompoundConditionOperationAttemptedBeforeInitialization } from './CompoundCondition';
import Condition, { InvalidJSONForCondition } from './Condition';

class And extends AbstractCondition implements CompoundCondition {

  private conditions: Condition[]|undefined = undefined;

  private conditionNames: string[];

  constructor(conditionNames: string[]){
    super(CheckOn.Both);
    this.conditionNames = conditionNames;
  } 

  //TODO abstract this with another abstract class
  public initPointers(conditionsMap: Map<string, Condition>): void {
    this.conditions = this.conditionNames.map(conditionName => {
      if(!conditionsMap.has(conditionName)){
        throw new CompoundConditionFailedToInitialize(conditionName);
      }
      return conditionsMap.get(conditionName)!;
    })

  }

  private checkInitialized(): void {
    if(this.conditions===undefined){
      throw new CompoundConditionOperationAttemptedBeforeInitialization("checkInitialized");
    }
  }
  
  
   public getDependencies(): string[] { 
      return this.conditionNames;
    }


  //it is safe to assume that all dependencies are reinitialized by the conversation
  public init(): void {}

  protected check(conversation: Conversation, dependencyResults: Map<Condition, boolean>): Promise<boolean> {
    this.checkInitialized();
    return Promise.resolve(this.conditions!.every(condition => dependencyResults.get(condition)))
  }

  public static fromJSON(json: any,): And {
    if(json.conditions===undefined){
      throw new InvalidJSONForCondition(json, "conditions");
    }
    if(!Array.isArray(json.conditions)){
      throw new InvalidJSONForCondition(json, "conditions");
    }
    return new And(json.conditions);
  }

  public isCompound(): boolean {
    return true;
  }
}

export default And