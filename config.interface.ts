export interface Setting {
  daysInHistogram: number
  collectResponseTimes: boolean
  allmonitorsOperational: string
  notAllmonitorsOperational: string
  monitorLabelOperational: string
  monitorLabelNotOperational: string
  monitorLabelNoData: string
  dayInHistogramNoData: string
  dayInHistogramOperational: string
  dayInHistogramNotOperational: string

  userAgent?: string
}

export interface Monitor {
  id: string
  name: string
  description: string
  url: string
  method: string
  expectStatus: number
  followRedirect: boolean
  linkable: boolean
}

export interface Config {
  readonly setting: Setting
  readonly monitors: Monitor[]
}

export interface KV {
  lastUpdate: KVLastUpdate
  monitors: { [key: string]: KVMonitor }
}

export interface KVLastUpdate {
  allOperational?: boolean
  time?: number
  loc?: string
}

export interface KVMonitorLastCheck {
  status: number
  statusText: string
  operational: boolean
}

export interface KVMonitorCheckRes {
  n: number
  ms: number
  a: number
}

export interface KVMonitorCheck {
  fails: number
  res: { [key: string]: KVMonitorCheckRes }
}

export interface KVMonitor {
  firstCheck: string
  lastCheck: KVMonitorLastCheck
  checks: { [key: string]: KVMonitorCheck }
}