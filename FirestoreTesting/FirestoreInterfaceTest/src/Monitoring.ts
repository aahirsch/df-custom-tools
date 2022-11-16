import fetch from "node-fetch-commonjs"

import {exec} from "child_process"



async function makeQuery(query:string, token:string): Promise<any>{
  const response = await fetch("https://monitoring.googleapis.com/v3/projects/heartschat-prod-a505/timeSeries:query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: `{"query": "${query}"}`
  })

  return response.json()
}

//returns [lookupReads, queryReads]
async function getReads(token:string, seconds:number): Promise<[number,number]>{
  return new Promise(async (resolve, reject) => {
    const query = `fetch firestore_instance::firestore.googleapis.com/document/read_count | delta ${seconds}s`

    const data = await makeQuery(query, token)
    //timeSeriesData is empty if there are no reads
    var lookupReads = 0
    var queryReads = 0

    if(data.timeSeriesData==undefined){
      resolve([0,0])
      return
    }

    const dataPoints=data.timeSeriesData.length
    for(var i=0;i<dataPoints;i++){
      if(data.timeSeriesData[i].labelValues[2].stringValue=="LOOKUP"){
        lookupReads = parseInt(data.timeSeriesData[i].pointData[0].values[0].int64Value)
      }
      if(data.timeSeriesData[i].labelValues[2].stringValue=="QUERY"){
        queryReads = parseInt(data.timeSeriesData[i].pointData[0].values[0].int64Value)
      }
    }
     
    //resolve([data.timeSeriesData[0].pointData[0].values[0].int64Value, data.timeSeriesData[1].pointData[0].values[0].int64Value])
    resolve([lookupReads, queryReads])

  }) 
}

//returns [updateWrites, createWrites]
async function getWrites(token:string, seconds:number): Promise<[number,number]>{
  return new Promise(async (resolve, reject) => {
    const query = `fetch firestore_instance::firestore.googleapis.com/document/write_count | delta ${seconds}s`

    const data = await makeQuery(query, token)

    var updateWrites:number = 0
    var createWrites:number = 0

    if(data.timeSeriesData==undefined){
      resolve([0,0])
      return
    }

    const dataPoints=data.timeSeriesData.length


    for(var i=0;i<dataPoints;i++){
      if(data.timeSeriesData[i].labelValues[2].stringValue=="UPDATE"){
        updateWrites = parseInt(data.timeSeriesData[i].pointData[0].values[0].int64Value)
      }
      if(data.timeSeriesData[i].labelValues[2].stringValue=="CREATE"){
        createWrites = parseInt(data.timeSeriesData[i].pointData[0].values[0].int64Value)
      }
    }

    //resolve([data.timeSeriesData[0].pointData[0].values[0].int64Value, data.timeSeriesData[1].pointData[0].values[0].int64Value])
    resolve([updateWrites, createWrites])
  }) 
}

async function getNewToken(): Promise<string>{
  return new Promise((resolve, reject) => {
    exec(`gcloud auth print-access-token firebase-adminsdk-dgjo6@heartschat-prod-a505.iam.gserviceaccount.com --scopes "https://www.googleapis.com/auth/monitoring"`,
      (error, stdout, stderr) => {
        if(error){
          reject(error)
        }else{
          resolve(stdout.slice(0,236))
        }
      })
  })
}

//returns [timeTaken,lookupReads, queryReads, updateWrites, createWrites]
async function metricWrapper(fun: () => Promise<any>): Promise<[number,number,number,number,number]>{
  const token:string=await getNewToken()
  return new Promise(async (resolve, reject) => {
    const start = new Date()
    fun().then( async () => setTimeout(
      async () => {
        const end = new Date()
        const ms = end.getTime() - start.getTime()
        const seconds = Math.ceil((ms)/1000)
        const [lookupReads, queryReads] = await getReads(token, seconds)
        const [updateWrites, createWrites] = await getWrites(token, seconds)
        resolve([ms,lookupReads, queryReads, updateWrites, createWrites])
    },60*4*1000))
  })
}

export default metricWrapper