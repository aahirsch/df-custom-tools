import Conversation from "../Conversation";
import Extractor from "../Extractors/Extractor";
import GetExtractorFromJSON from "../Extractors/GetExtractorFromJSON";
import AbstractCondition, { CheckOn } from "./AbstractCondition";
import { InvalidJSONForCondition } from "./Condition";

enum Comparison{
  EqualTo,
  GreaterThan,
  GreaterThanOrEqualTo,
  LessThan,
  LessThanOrEqualTo,
  NotEqualTo,
  DivisibleBy,
}

class ExtractedNumberIs extends AbstractCondition {
  
  private extractor: Extractor<number>;
  private comparison: Comparison;
  private target: number;

  private lessThan = (a: number, b: number) => a < b;
  private lessThanOrEqualTo = (a: number, b: number) => a <= b;
  private greaterThan = (a: number, b: number) => a > b;
  private greaterThanOrEqualTo = (a: number, b: number) => a >= b;
  private equalTo = (a: number, b: number) => a === b;
  private notEqualTo = (a: number, b: number) => a !== b;
  private divisibleBy = (a: number, b: number) => a % b === 0;

  private comparisonFunction: Map<Comparison, (a: number, b: number) => boolean> = new Map([
    [Comparison.EqualTo, this.equalTo],
    [Comparison.GreaterThan, this.greaterThan],
    [Comparison.GreaterThanOrEqualTo, this.greaterThanOrEqualTo],
    [Comparison.LessThan, this.lessThan],
    [Comparison.LessThanOrEqualTo, this.lessThanOrEqualTo],
    [Comparison.NotEqualTo, this.notEqualTo],
    [Comparison.DivisibleBy, this.divisibleBy],
  ]);

  constructor(extractor: Extractor<number>, comparison: Comparison, target : number) {
    //because this condition is very fast and cheap for most extractor
    super(CheckOn.Both);

    this.extractor = extractor;
    this.comparison = comparison;
    this.target = target;
  }

  protected check(conversation: Conversation): Promise<boolean> {

    return this.extractor.extract(conversation).then(result => {

      if(result == null){
        return false
      }

      //#FF0000 TEMPRARY LINE
      //if(this.comparisonFunction.get(this.comparison)!(result,this.target)){
      //  console.log("\t condition met - ExtractedNumberIs: " + result + " " + this.comparison + " " + this.target)
      //}

      return this.comparisonFunction.get(this.comparison)!(result, this.target);
    });

  }

  //TODO only save each extractor once and involve the control system here

  public static fromJSON(json: any, callAPI:CallAPIFunction): ExtractedNumberIs {
    if(json.extractor===undefined){
      throw new InvalidJSONForCondition(json, "extractor");
    }
    if(json.comparison===undefined){
      throw new InvalidJSONForCondition(json, "comparison");
    }
    if(json.target===undefined || typeof json.target !== "number"){
      throw new InvalidJSONForCondition(json, "target");
    }

    var comparison: Comparison;

    switch(json.comparison){
      case "EqualTo":
        comparison = Comparison.EqualTo;
        break;
      case "GreaterThan":
        comparison = Comparison.GreaterThan;
        break;
      case "GreaterThanOrEqualTo":
        comparison = Comparison.GreaterThanOrEqualTo;
        break;
      case "LessThan":
        comparison = Comparison.LessThan;
        break;
      case "LessThanOrEqualTo":
        comparison = Comparison.LessThanOrEqualTo;
        break;
      case "NotEqualTo":
        comparison = Comparison.NotEqualTo;
        break;
      case "DivisibleBy":
        comparison = Comparison.DivisibleBy;
        break;
      default:
        throw new InvalidJSONForCondition(json, "comparison");
    }

    

    return new ExtractedNumberIs(GetExtractorFromJSON(json.extractor,callAPI), comparison, json.target);
  }

}

export default ExtractedNumberIs