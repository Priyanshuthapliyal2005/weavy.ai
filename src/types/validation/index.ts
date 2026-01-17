export interface ConnectionInfo {
  nodeId: string
  handleId: string
  nodeType?: 'text' | 'image' | 'llm'
  isOutput: boolean
}

