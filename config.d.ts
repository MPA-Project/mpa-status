declare module '*.yaml' {
  interface monitor {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly url: string
    readonly method: string
    readonly expectStatus: number
    readonly followRedirect: boolean
    readonly linkable: boolean
  }
  const classes: { 
    readonly settings: {
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
      url?: string
    }
    readonly monitors: monitor[]
    // readonly [key: string]: string
  }
  export default classes
}