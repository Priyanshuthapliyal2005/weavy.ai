import { NODE_COLORS, HANDLE_COLORS } from "@/constants/colors"

export function getHandleColor(handleId: string, nodeType: string, isOutput: boolean): string {
  if (!isOutput) {
    switch (handleId) {
      case 'prompt':
      case 'system_prompt':
      case 'user_message':
        return HANDLE_COLORS.prompt
      case 'images':
      case 'image':
      case 'image_1':
      case 'image_2':
      case 'image_3':
      case 'image_url':
        return HANDLE_COLORS.IMAGE
      case 'video_url':
        return HANDLE_COLORS.VIDEO
      case 'x_percent':
      case 'y_percent':
      case 'width_percent':
      case 'height_percent':
      case 'timestamp':
        return HANDLE_COLORS.NUMBER
      case 'input':
        return HANDLE_COLORS.LLM
      default:
        return HANDLE_COLORS.default
    }
  }

  // Output handles
  switch (nodeType) {
    case 'text':
    case 'llm':
      return HANDLE_COLORS.TEXT
    case 'image':
    case 'crop':
    case 'extract':
      return HANDLE_COLORS.IMAGE
    case 'video':
      return HANDLE_COLORS.VIDEO
    default:
      return NODE_COLORS.text
  }
}