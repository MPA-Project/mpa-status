import { processCronTrigger } from './src/functions/cronTrigger'

addEventListener('fetch', (event) => {
  return event.respondWith(
    new Response('OK', {
      status: 200,
    }),
  )
})

addEventListener('scheduled', (event) => {
  event.waitUntil(processCronTrigger(event))
})
