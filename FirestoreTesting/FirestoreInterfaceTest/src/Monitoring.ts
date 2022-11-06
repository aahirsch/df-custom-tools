import fetch from "node-fetch"

import {exec} from "child_process"



async function makeQuery(query:string, token:string): Promise<any>{
  const response = await fetch("https://monitoring.googleapis.com/v3/projects/heartschat-prod-a505/timeSeries:query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`
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

    resolve([data.timeSeriesData[0].pointData[0].values[0].int64Value, data.timeSeriesData[1].pointData[0].values[0].int64Value])

  }) 
}

//returns [updateWrites, createWrites]
async function getWrites(token:string, seconds:number): Promise<[number,number]>{
  return new Promise(async (resolve, reject) => {
    const query = `fetch firestore_instance::firestore.googleapis.com/document/write_count | delta ${seconds}s`

    const data = await makeQuery(query, token)

    resolve([data.timeSeriesData[0].pointData[0].values[0].int64Value, data.timeSeriesData[1].pointData[0].values[0].int64Value])

  }) 
}

async function metricWrapper(fun: () => Promise<any>): Promise<[number,number,number,number]>{
  const token:string=await getNewToken()
  return new Promise(async (resolve, reject) => {
    const start = new Date()
    fun().then(async () => {
      const end = new Date()
      const seconds = (end.getTime() - start.getTime())/1000
      const [lookupReads, queryReads] = await getReads(token, seconds)
      const [updateWrites, createWrites] = await getWrites(token, seconds)
      resolve([lookupReads, queryReads, updateWrites, createWrites])
    })
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

export default metricWrapper