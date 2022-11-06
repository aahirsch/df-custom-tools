import internal from "stream";
import  {Message} from "./DatabaseInterface"
declare var require: any


// function CSVtoArray(text : string) : string[]{
//   var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
//   var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
//   // Return NULL if input string is not well formed CSV string.

//   var a = [];                     // Initialize array to receive values.
//   text.replace(re_value, // "Walk" the string using replace with callback.
//       function(m0, m1, m2, m3) {
//           // Remove backslash from \' in single quoted values.
//           if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
//           // Remove backslash from \" in double quoted values.
//           else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
//           else if (m3 !== undefined) a.push(m3);
//           return ''; // Return empty string.
//       });
//   // Handle special case of empty last value.
//   if (/,\s*$/.test(text)) a.push('');
//   return a;
// };

'use strict';

function csvToArray(text:string) {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [l = '']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret;
};



export const parser = (filepath: string) => {
    const fs  = require('fs')
    const csvfile = fs.readFileSync(filepath)
    const arr = csvfile.toString().split("\n")



    var jsonObject = [];
    var toplevelHeaders = arr[0].split(',');


    var paraDef = ['Q81', 'Q82', 'Q83', 'Q84'];
    
    var headerMaps = new Map();

    headerMaps.set('sessionId', 'responseId');
    headerMaps.set('surveyId', 'surveyId');
    headerMaps.set('agentId', 'agentId');
    headerMaps.set('request', 'input');
    headerMaps.set('response', 'output');
    headerMaps.set('timestamp', 'timestamp');

    for(var i=1; i < arr.length; i++){
        var data = csvToArray(arr[i]);
        const object: {[index: string]:any} = {} as Message;
        const paramters: {[index: string]:any} = {};
        let offers: string[] = [];
        for(var j=0;j < data[0].length;j++){
          if (typeof headerMaps.get(toplevelHeaders[j]) != 'undefined'){
              var filler : string = headerMaps.get(toplevelHeaders[j]);
              object[filler] = data[0][j];
          }
          if (paraDef.includes(toplevelHeaders[j])){
              var placeHolder : string = toplevelHeaders[j];
              offers.push(data[0][j]);
          }
        }
        paramters['offers'] = offers;
        object['parameters'] = paramters;
        jsonObject.push(object)
      }
      return jsonObject
}



