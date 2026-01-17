'use client'

import { ConnectionLineComponentProps } from '@xyflow/react'

interface CustomConnectionLineProps extends ConnectionLineComponentProps {
  sourceColor?: string
  targetColor?: string
}

export function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  sourceColor = '#3b82f6',
  targetColor,
}: CustomConnectionLineProps) {
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2

  return (
    <g>
      <path
        fill="none"
        stroke={sourceColor}
        strokeWidth={2}
        d={`M ${fromX} ${fromY} Q ${midX} ${fromY} ${midX} ${midY} Q ${midX} ${toY} ${toX} ${toY}`}
        strokeDasharray="5,5"
      />
      {targetColor && (
        <circle
          cx={toX}
          cy={toY}
          r={4}
          fill={targetColor}
          stroke={sourceColor}
          strokeWidth={2}
        />
      )}
    </g>
  )
}