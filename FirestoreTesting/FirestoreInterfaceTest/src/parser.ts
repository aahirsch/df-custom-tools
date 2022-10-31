import  {Message} from "./DatabaseInterface"
declare var require: any


export const parser = (filepath: string) => {
    const fs  = require('fs')
    const csvfile = fs.readFileSync(filepath)
    const arr = csvfile.toString().split("\n")


    var jsonObject = [];
    var toplevelHeaders = arr[0].split(',')
    var paraDef = ['Q81', 'Q82', 'Q83', 'Q84'];

    var headerMaps = new Map();
    headerMaps.set('sessionId', 'surveyId');
    headerMaps.set('agentId', 'agentId');
    headerMaps.set('responseId', 'responseId');
    headerMaps.set('request', 'input');
    headerMaps.set('response', 'output');
    headerMaps.set('timestamp', 'timestamp');

    for(var i=1; i < arr.length; i++){
        var data = arr[i].split(',');
        const object: {[index: string]:any} = {} as Message;
        var parameters: {[index: string]:any} = {};
        for(var j=0;j < data.length;j++){
          if (typeof headerMaps.get(toplevelHeaders[j]) !== 'undefined'){
              var filler : string = headerMaps.get(toplevelHeaders[j]);
              object[filler] = data[j].trim();
          }
          if (paraDef.includes(toplevelHeaders[j])){
              var placeHolder : string = toplevelHeaders[j];
              parameters[placeHolder] = data[j].trim();
          }
        }
        object['parameters'] = parameters;
        jsonObject.push(object)
      }
      return jsonObject
}

