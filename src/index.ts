import { handleRequest } from './handler'
import { processCronTrigger } from './functions/cronTrigger'

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request))
})

addEventListener('scheduled', (event: any) => {
  event.waitUntil(processCronTrigger(event))
})
