

//this class should keep track of codes being used and generate new ones when needed

class NumberCoding {
  private forwardCodeMap: Map<number, string> = new Map<number, string>();
  private backwardCodeMap: Map<string, number> = new Map<string, number>();

  private codeCounter=0;

  //ascending
  public orderedCodes: Array<string> = new Array<string>();

  public findCodeRegex = /\$[a-z]+\$/g;

  private insertCode(code:string){
    for(let i=0;i<this.orderedCodes.length;i++){
      if(this.backwardCodeMap.get(this.orderedCodes[i])!>this.backwardCodeMap.get(code)!){
        this.orderedCodes.splice(i,0,code);
        return;
      }
    }
    this.orderedCodes.push(code);
  }

  private generateCode(num: number): string {
    var code = "$";
    for(var i=0;i<Math.floor(this.codeCounter/26)+1;i++){
      code+=String.fromCharCode(this.codeCounter%26+97);
    }
    this.codeCounter++;
    code+="$"
    return code;
  }

  private addCode(num:number): string {
    let code = this.generateCode(num);
    this.forwardCodeMap.set(num, code);
    this.backwardCodeMap.set(code, num);
    this.insertCode(code);
    return code;
  }

  private getCode(num:number): string {
    if(this.forwardCodeMap.has(num)){
      return this.forwardCodeMap.get(num)!;
    }
    return this.addCode(num);
  }

  //assume normalized input
  public encode(input: string): string {
    const prices = input.match(/\d+/g);
    if(prices==null){
      return input;
    }

    prices.forEach(price => {
      input = input.replace(price, this.getCode(parseInt(price)));
    });

    return input

  }

  public decode(input: string): string {
    this.orderedCodes.forEach(code => {
      input = input.replace(code, this.backwardCodeMap.get(code)!.toString());
    });
    return input;
  }

  public getNumberFromCode(code:string):number|undefined{
    return this.backwardCodeMap.get(code);
  }
}

export default NumberCoding;