
import { HANDLE_COLORS, NODE_COLORS } from '@/constants/colors'

export function getHandleColor(
  handleId: string,
  nodeType: 'text' | 'image' | 'llm' | undefined,
  isOutput: boolean
): string {
  
  if (handleId?.startsWith('image_') || handleId === 'images' || handleId === 'image') {
    return HANDLE_COLORS.image
  }
  
  
  if (isOutput) {
    if (nodeType === 'image') {
      return HANDLE_COLORS.image
    }
    return HANDLE_COLORS.text
  }
  
  
  if (handleId === 'prompt' || handleId === 'system_prompt') {
    return HANDLE_COLORS.prompt
  }
  
  
  return HANDLE_COLORS.text
}
