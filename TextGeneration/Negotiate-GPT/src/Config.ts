type Config = {
  preamble:string,
  humanPartyName:string,
  aiPartyName:string,
  temperature:number,
  maxOutputLength:number,
  controlSystem:{
    conditions:any[],
    actions:any[],
    controlParis:any[]
  }
}

export default Config