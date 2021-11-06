import { S3 } from 'aws-sdk'
const yaml = require('yaml-loader')
const fs = require('fs')

import {
  notifySlack,
  notifyTelegram,
  getCheckLocation,
  getKVMonitors,
  setKVMonitors,
  notifyDiscord,
} from './helpers'

export function loadConfig() {
  const configFile = fs.readFileSync('./config.yaml', 'utf8')
  const config = yaml(configFile)
  return JSON.parse(config)
}

const config = loadConfig()

function getDate() {
  return new Date().toISOString().split('T')[0]
}

export async function processCronTrigger(event) {
  // Get Worker PoP and save it to monitorsStateMetadata
  const checkLocation = await getCheckLocation()
  const checkDay = getDate()

  // Init monitors state
  let monitorsState = null
  const s3 = new S3({
    endpoint: process.env.AWS_S3_ENDPOINT,
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_KEY
    },
  })

  const s3ParamsDownload = {
    Key: process.env.STORE_FILENAME,
    Bucket: process.env.AWS_S3_BUCKET,
  };

  // Get monitors state from S3
  try {
    const getData = await s3.getObject(s3ParamsDownload).promise()
    if (getData.Body) {
      const getDataBody = JSON.parse(getData.Body?.toString()) || null
      monitorsState = getDataBody
    }
  } catch (error) {
    return new Response(error.message || error.toString(), {
      status: 500,
    })
  }

  // Create empty state objects if not exists in KV storage yet
  if (!monitorsState) {
    monitorsState = { lastUpdate: {}, monitors: {} }
  }

  // Reset default all monitors state to true
  monitorsState.lastUpdate.allOperational = true

  for (const monitor of config.monitors) {
    // Create default monitor state if does not exist yet
    if (typeof monitorsState.monitors[monitor.id] === 'undefined') {
      monitorsState.monitors[monitor.id] = {
        firstCheck: checkDay,
        lastCheck: {},
        checks: {},
      }
    }

    console.log(`Checking ${monitor.name} ...`)

    // Fetch the monitors URL
    const init = {
      method: monitor.method || 'GET',
      redirect: monitor.followRedirect ? 'follow' : 'manual',
      headers: {
        'User-Agent': config.settings.userAgent || 'cf-worker-status-page',
      },
    }

    // Perform a check and measure time
    const requestStartTime = Date.now()
    const checkResponse = await fetch(monitor.url, init)
    const requestTime = Math.round(Date.now() - requestStartTime)

    // Determine whether operational and status changed
    const monitorOperational =
      checkResponse.status === (monitor.expectStatus || 200)
    const monitorStatusChanged =
      monitorsState.monitors[monitor.id].lastCheck.operational !==
      monitorOperational

    // Save monitor's last check response status
    monitorsState.monitors[monitor.id].lastCheck = {
      status: checkResponse.status,
      statusText: checkResponse.statusText,
      operational: monitorOperational,
    }

    // Send Slack message on monitor change
    if (
      monitorStatusChanged &&
      typeof SECRET_SLACK_WEBHOOK_URL !== 'undefined' &&
      SECRET_SLACK_WEBHOOK_URL !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifySlack(monitor, monitorOperational))
    }

    // Send Telegram message on monitor change
    if (
      monitorStatusChanged &&
      typeof SECRET_TELEGRAM_API_TOKEN !== 'undefined' &&
      SECRET_TELEGRAM_API_TOKEN !== 'default-gh-action-secret' &&
      typeof SECRET_TELEGRAM_CHAT_ID !== 'undefined' &&
      SECRET_TELEGRAM_CHAT_ID !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyTelegram(monitor, monitorOperational))
    }

    // Send Discord message on monitor change
    if (
      monitorStatusChanged &&
      typeof SECRET_DISCORD_WEBHOOK_URL !== 'undefined' &&
      SECRET_DISCORD_WEBHOOK_URL !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyDiscord(monitor, monitorOperational))
    }

    // make sure checkDay exists in checks in cases when needed
    if (
      (config.settings.collectResponseTimes || !monitorOperational) &&
      !monitorsState.monitors[monitor.id].checks.hasOwnProperty(checkDay)
    ) {
      monitorsState.monitors[monitor.id].checks[checkDay] = {
        fails: 0,
        res: {},
      }
    }

    if (config.settings.collectResponseTimes && monitorOperational) {
      // make sure location exists in current checkDay
      if (
        !monitorsState.monitors[monitor.id].checks[checkDay].res.hasOwnProperty(
          checkLocation,
        )
      ) {
        monitorsState.monitors[monitor.id].checks[checkDay].res[
          checkLocation
        ] = {
          n: 0,
          ms: 0,
          a: 0,
        }
      }

      // increment number of checks and sum of ms
      const no = ++monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].n
      const ms = (monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].ms += requestTime)

      // save new average ms
      monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].a = Math.round(ms / no)
    } else if (!monitorOperational) {
      // Save allOperational to false
      monitorsState.lastUpdate.allOperational = false

      // Increment failed checks, only on status change (maybe call it .incidents instead?)
      if (monitorStatusChanged) {
        monitorsState.monitors[monitor.id].checks[checkDay].fails++
      }
    }
  }

  // Save last update information
  monitorsState.lastUpdate.time = Date.now()
  monitorsState.lastUpdate.loc = checkLocation

  // Save monitorsState to S3 storage
  // await setKVMonitors(monitorsState)
  const s3ParamsUpload = {
    Key: process.env.STORE_FILENAME,
    Bucket: process.env.AWS_S3_BUCKET,
    Body: JSON.stringify(monitorsState),
  }

  try {
    await s3.upload(s3ParamsUpload).promise()
  } catch (error) {
    return new Response(error.message || error.toString(), {
      status: 500,
    })
  }

  return new Response('OK')
}
