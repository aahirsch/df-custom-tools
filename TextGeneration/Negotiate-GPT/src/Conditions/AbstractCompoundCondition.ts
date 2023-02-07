import AbstractCondition, { CheckOn } from "./AbstractCondition";
import CompoundCondition, { CompoundConditionFailedToInitialize } from "./CompoundCondition";
import Condition, { InvalidJSONForCondition } from "./Condition";

abstract class AbstractCompoundCondition extends AbstractCondition implements CompoundCondition{

  private conditionNames: string[];

  protected conditions: Condition[]|undefined = undefined;

  constructor(conditionNames: string[]){
    //because compound conditions tend to be cheap, it is fine to check on both
    super(CheckOn.Both);

    this.conditionNames = conditionNames;
  }

  public initPointers(conditionsMap: Map<string, Condition>): void {
    this.conditions = this.conditionNames.map(conditionName => {
      if(!conditionsMap.has(conditionName)){
        throw new CompoundConditionFailedToInitialize(conditionName);
      }
      return conditionsMap.get(conditionName)!;
    })
  }

  protected checkInitialized(): void {
    if(this.conditions===undefined){
      throw new CompoundConditionFailedToInitialize("getDependencies");
    }
  }


  public getDependencies(): Condition[] {
    this.checkInitialized();
    return this.conditions!;
  }

  //imports conditions
  protected fromJSON(JSON:any){
    if(JSON.conditions===undefined){
      throw new InvalidJSONForCondition(JSON, "conditions");
    }
    if(!Array.isArray(JSON.conditions)){
      throw new InvalidJSONForCondition(JSON, "conditions");
    }

    this.conditions = JSON.conditions;
  }

  public isCompound():boolean{
    return true;
  }
  
}

export default AbstractCompoundCondition