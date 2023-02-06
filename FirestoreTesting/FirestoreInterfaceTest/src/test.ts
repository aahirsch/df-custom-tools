let x = new Date()
let y = x.toISOString()
console.log(y)
import { firestore } from 'firebase-admin'

let z = firestore.Timestamp.now()
let k = z.valueOf()
console.log(k)