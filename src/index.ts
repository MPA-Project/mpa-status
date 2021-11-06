import { handleRequest } from './handler'
import { processCronTrigger } from './functions/cronTrigger'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

addEventListener('scheduled', (event) => {
  event.waitUntil(processCronTrigger(event))
})
