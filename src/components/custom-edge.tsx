'use client';

import { getBezierPath, type EdgeProps, useReactFlow } from '@xyflow/react';
import { NODE_COLORS } from '@/constants/colors';
import { getHandleColor } from '@/lib/handle-colors';

export function CustomEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    source,
    target,
    data,
  } = props
  const sourceHandle = (props as any).sourceHandle
  const targetHandle = (props as any).targetHandle
  const { getNode } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  
  if (!edgePath || edgePath.trim() === '') {
    return null;
  }

  
  let sourceColor: string | undefined = typeof data?.sourceColor === 'string' ? data.sourceColor : undefined;
  let targetColor: string | undefined = typeof data?.targetColor === 'string' ? data.targetColor : undefined;
  
  
  if (!sourceColor || !targetColor) {
    const sourceNode = getNode(source);
    const targetNode = getNode(target);
    
    
    if (!sourceColor && sourceNode) {
      const sourceHandleId = sourceHandle || data?.sourceHandle || 'output';
      sourceColor = getHandleColor(sourceHandleId, sourceNode.type as 'text' | 'image' | 'llm', true);
    }
    
    if (!targetColor && targetNode) {
      const targetHandleId = targetHandle || data?.targetHandle || 'input';
      targetColor = getHandleColor(targetHandleId, targetNode.type as 'text' | 'image' | 'llm', false);
    }
  }
  
  
  sourceColor = sourceColor || NODE_COLORS.text;
  targetColor = targetColor || NODE_COLORS.text;
  
  
  const useGradient = sourceColor !== targetColor;
  const gradientId = `gradient-${id}`;

  return (
    <>
      {useGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={sourceColor} />
            <stop offset="100%" stopColor={targetColor} />
          </linearGradient>
        </defs>
      )}
      <path
        id={id}
        style={{
          ...style,
          stroke: useGradient ? `url(#${gradientId})` : sourceColor,
          strokeWidth: style.strokeWidth || 2,
          fill: 'none',
          opacity: 1,
          visibility: 'visible',
          
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
    </>
  );
}
