declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ArpixDataTable: DefineComponent<undefined, undefined, any>
    ArpixDataTableHeader: DefineComponent<undefined, undefined, any>
    ArpixDataTableBody: DefineComponent<undefined, undefined, any>
    ArpixDataTablePagination: DefineComponent<undefined, undefined, any>
    ProgressBar: DefineComponent<{
      value: number
      color?: string
      showLabel?: boolean
      suffix?: string
    }, undefined, any>
    TagsList: DefineComponent<{
      tags: string[] | number[]
      colorMap?: Record<string, string>
      defaultColor?: string
      clickable?: boolean
    }, undefined, any>
  }
}
