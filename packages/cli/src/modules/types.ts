export type ModuleFile = {
  path: string      // relative to project root
  content: string
}

export type ModuleWorkItemType = {
  name: string
  knowledgeLevel: 'K0' | 'K1' | 'K2' | 'K3' | 'K4'
  description: string
  questions: {
    id: string
    prompt: string
    placeholder: string
    frontMatterField: string
    required: boolean
  }[]
  qualityGate: string[]
  extraFrontMatter?: Record<string, unknown>
}

export type KaddoModule = {
  name: string
  description: string
  dirs: string[]
  files: ModuleFile[]
  workItemTypes: ModuleWorkItemType[]
  configKey: string
}
