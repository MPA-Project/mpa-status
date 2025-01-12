import config from '../../config.yaml'
import { FormData } from 'formdata-node'

const kvDataKey = 'monitors_data_v1_1'

export async function getKVMonitors() {
  // trying both to see performance difference
  return KV_STATUS_PAGE.get(kvDataKey, 'json')
  //return JSON.parse(await KV_STATUS_PAGE.get(kvDataKey, 'text'))
}

export async function setKVMonitors(data: any) {
  return setKV(kvDataKey, JSON.stringify(data))
}

const getOperationalLabel = (operational: any) => {
  return operational
    ? config.settings.monitorLabelOperational
    : config.settings.monitorLabelNotOperational
}

export async function setKV(key: string, value: any, metadata = undefined, expirationTtl = undefined) {
  return KV_STATUS_PAGE.put(key, value, { metadata, expirationTtl })
}

export async function notifySlack(monitor: any, operational: any) {
  const payload = {
    attachments: [
      {
        fallback: `Monitor ${monitor.name} changed status to ${getOperationalLabel(operational)}`,
        color: operational ? '#36a64f' : '#f2c744',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Monitor *${
                monitor.name
              }* changed status to *${getOperationalLabel(operational)}*`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `${operational ? ':white_check_mark:' : ':x:'} \`${
                  monitor.method ? monitor.method : 'GET'
                } ${monitor.url}\` - :eyes: <${
                  config.settings.url
                }|Status Page>`,
              },
            ],
          },
        ],
      },
    ],
  }
  return fetch(SECRET_SLACK_WEBHOOK_URL, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function notifyTelegram(monitor: any, operational: any) {
  const text = `Monitor *${monitor.name.replace(
    '-',
    '\\-',
  )}* changed status to *${getOperationalLabel(operational)}*
  ${operational ? '✅' : '❌'} \`${monitor.method ? monitor.method : 'GET'} ${
    monitor.url
  }\` \\- 👀 [Status Page](${config.settings.url})`

  const payload = new FormData()
  payload.set('chat_id', SECRET_TELEGRAM_CHAT_ID)
  payload.set('parse_mode', 'MarkdownV2')
  payload.set('text', text)
  const bodyPayload = new URLSearchParams(payload as any).toString()

  const telegramUrl = `https://api.telegram.org/bot${SECRET_TELEGRAM_API_TOKEN}/sendMessage`
  return fetch(telegramUrl, {
    method: 'POST',
    body: bodyPayload,
  })
}

// Visualize your payload using https://leovoel.github.io/embed-visualizer/
export async function notifyDiscord(monitor: any, operational: any) {
  const payload = {
    embeds: [
      {
        title: `${monitor.name} is ${getOperationalLabel(operational)} ${
          operational ? ':white_check_mark:' : ':x:'
        }`,
        description: `\`${monitor.method ? monitor.method : 'GET'} ${
          monitor.url
        }\` - :eyes: [Status Page](${config.settings.url})`,
        color: operational ? 3581519 : 13632027,
      },
    ],
  }
  return fetch(SECRET_DISCORD_WEBHOOK_URL, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function getCheckLocation(): Promise<string | undefined> {
  const requestAxios = await fetch('https://cloudflare-dns.com/dns-query', {
    method: 'OPTIONS',
  })
  const headers = requestAxios.headers
  if (headers.has('cf-ray') || Object.prototype.hasOwnProperty.call(headers, 'cf-ray')) {
    const getCfRay = headers.get('cf-ray')
    if (getCfRay) {
      getCfRay.split('-')[1]
    }
  }
  return undefined
}

export async function sendLog(message: string, meta: any = {}) {
  const payload = { 
    lines: [ 
      { 
        line: message, 
        app: "MPA-Status",
        level: "INFO",
        meta
      }
    ] 
  }
  return fetch(`https://logs.logdna.com/logs/ingest?now=${Date.now()}`, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: {
      Authorization: `Basic ${LOG_DNA_INGESTION}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
  })
}
