import Conversation from "../Conversation";
import Condition from "./Condition";

class CompoundConditionFailedToInitialize extends Error{
   constructor(missingCondition: string){
      super(`CompoundCondition failed to initialize. Missing condition: ${missingCondition}`);
   }
}

class CompoundConditionOperationAttemptedBeforeInitialization extends Error{
   constructor(operation: string){
      super(`CompoundCondition operation attempted before initialization: ${operation}`)
   }
}

interface CompoundCondition extends Condition {

   //initializes the pointers to the conditions
   //this should be run after importing from JSON
   initPointers: (conditionsMap:Map<string,Condition>) => void;

   //list of condition keys
   getDependencies: () => string[];

   afterUserMessageCheck: (conversation:Conversation,
      dependencyResults: Map<Condition, boolean>,
      ...args: any[]
      ) => Promise<boolean>;

   afterBotMessageCheck: (conversation:Conversation,
      dependencyResults: Map<Condition, boolean>,
      ...args:any[]
      ) => Promise<boolean>;

}

export default CompoundCondition

export { CompoundCondition, CompoundConditionFailedToInitialize, CompoundConditionOperationAttemptedBeforeInitialization }