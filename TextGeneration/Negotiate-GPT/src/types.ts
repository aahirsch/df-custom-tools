type CallAPIFunction = {
  (prompt:string, temperature:number, maxTokens: number, stop:Array<string>):Promise<string>
}

type ResponseRequest = {
  (lastResponse:string|undefined):Promise<string>
}