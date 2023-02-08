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


   /**
    * Initializes the condition pointers to the conditions in the conditions map. This must be called after importing all conditions.
    * 
    * @param conditionsMap a map of condition keys to conditions used for matching condition names in the JSON to condition objects
    * @returns 
    */
   initPointers: (conditionsMap:Map<string,Condition>) => void;

   /**
    * 
    * @returns the list of conditions that this compound condition depends on
    */
   getDependencies: () => Condition[];

   /**
    * 
    * Checks the condition is triggered. This is called after the user message is processed. 
    * 
    * @param conversation the conversation to check the condition for
    * @param lastState the last state of the condition
    * @param dependencyResults a map containing the results of the dependencies of this condition (will not be modified)
    * @param args 
    * @returns 
    */
   afterUserMessageCheck: (conversation:Conversation,
      lastState: boolean|undefined,
      dependencyResults: Map<Condition, boolean>,
      ...args: any[]
      ) => Promise<boolean>;


   /**
    * 
    * Checks the condition is triggered. This is called after the bot message is processed.
    * 
    * @param conversation the conversation to check the condition for
    * @param lastState the last state of the condition
    * @param dependencyResults a map containing the results of the dependencies of this condition (will not be modified)
    * @param args 
    * @returns 
    */
   afterBotMessageCheck: (conversation:Conversation,
      lastState: boolean|undefined,
      dependencyResults: Map<Condition, boolean>,
      ...args:any[]
      ) => Promise<boolean>;

}

export default CompoundCondition

export { CompoundCondition, CompoundConditionFailedToInitialize, CompoundConditionOperationAttemptedBeforeInitialization }