import { NODE_COLORS, HANDLE_COLORS } from "@/constants/colors"

export function getHandleColor(handleId: string, nodeType: string, isOutput: boolean): string {
  // Input handles
  if (!isOutput) {
    switch (handleId) {
      case 'prompt':
        return NODE_COLORS.text
      case 'system_prompt':
        return NODE_COLORS.text
      case 'image_1':
      case 'images':
        return NODE_COLORS.image
      case 'input':
        return NODE_COLORS.llm
      default:
        return NODE_COLORS.text
    }
  }

  // Output handles
  switch (nodeType) {
    case 'text':
      return NODE_COLORS.text
    case 'image':
      return NODE_COLORS.image
    case 'llm':
      return NODE_COLORS.llm
    default:
      return NODE_COLORS.text
  }
}