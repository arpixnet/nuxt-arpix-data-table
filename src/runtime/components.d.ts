import { DefineComponent } from 'vue'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ArpixDataTable: DefineComponent<{}, {}, any>
    ArpixDataTableHeader: DefineComponent<{}, {}, any>
    ArpixDataTableBody: DefineComponent<{}, {}, any>
    ArpixDataTablePagination: DefineComponent<{}, {}, any>
    ProgressBar: DefineComponent<{
      value: number
      color?: string
      showLabel?: boolean
      suffix?: string
    }, {}, any>
    TagsList: DefineComponent<{
      tags: string[] | number[]
      colorMap?: Record<string, string>
      defaultColor?: string
      clickable?: boolean
    }, {}, any>
  }
}
