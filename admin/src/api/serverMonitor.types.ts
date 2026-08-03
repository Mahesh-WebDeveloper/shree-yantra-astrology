export type ServerMonitorHistoryPoint = {
  t: string
  cpuPct: number
  memPct: number
  onlineUsers: number
  load1: number
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
  swap: {
    totalBytes: number
    usedBytes: number
    freeBytes: number
    usedPct: number
    totalHuman: string
    usedHuman: string
    freeHuman: string
  } | null
  pm2: {
    name: string
    status: string
    restarts: number
    cpuPct: number
    memoryBytes: number
    memoryHuman: string
    pid: number
  } | null
  database: {
    status: string
    ok: boolean
    stats: {
      collections: number
      objects: number
      dataSizeHuman: string
      storageSizeHuman: string
      indexSizeHuman: string
    } | null
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
  meta: {
    live: boolean
    sampledAt: string
    historyPoints: number
    sources: Record<string, string>
  }
}
