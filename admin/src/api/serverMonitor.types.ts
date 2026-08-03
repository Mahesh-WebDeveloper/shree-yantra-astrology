export type ServerMonitorHistoryPoint = {
  t: string
  cpuPct: number
  memPct: number
}

export type ServerMonitorResponse = {
  at: string
  host: {
    hostname: string
    platform: string
    arch: string
    cpus: number
    uptimeSec: number
    uptimeHuman: string
    nodeVersion: string
  }
  cpu: {
    usagePct: number
    load1: number
    load5: number
    cores: number
  }
  memory: {
    totalBytes: number
    usedBytes: number
    freeBytes: number
    usedPct: number
    totalHuman: string
    usedHuman: string
    freeHuman: string
  }
  process: {
    rssBytes: number
    heapUsedBytes: number
    heapTotalBytes: number
    rssHuman: string
    uptimeSec: number
    uptimeHuman: string
  }
  disk: {
    mount: string
    totalBytes: number
    usedBytes: number
    freeBytes: number
    usedPct: number
    totalHuman: string
    usedHuman: string
    freeHuman: string
  } | null
  database: {
    status: string
    ok: boolean
  }
  users: {
    onlineUsers: number
    onlineDevices: number
    activeToday: number
    activeWeek: number
    totalUsers: number
  }
  capacity: {
    estimatedMaxConcurrent: number
    comfortableConcurrent: number
    currentActiveUsers: number
    headroomPct: number
    usageVsComfortPct: number
    status: 'healthy' | 'busy' | 'critical'
    statusLabel: string
    statusLabelHi: string
    statusHint: string
    statusHintHi: string
    plainSummary: string
    plainSummaryHi: string
  }
  history: ServerMonitorHistoryPoint[]
}
