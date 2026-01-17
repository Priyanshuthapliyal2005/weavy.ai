import React from 'react'

export interface BaseNodeProps {
  id: string
  selected: boolean
  title: string
  titleIcon?: React.ComponentType<{ className?: string }>
  nodeType: 'text' | 'image' | 'llm'
  data: any
  children: React.ReactNode
  inputHandles?: Array<{
    id: string
    position?: 'left' | 'right'
    color?: string
    title?: string
    top?: string
  }>
  outputHandles?: Array<{
    id: string
    position?: 'left' | 'right'
    color?: string
    title?: string
  }>
  onDuplicate?: (
    nodeId: string,
    nodeType: 'text' | 'image' | 'llm',
    data: any
  ) => void
  minWidth?: string
  maxWidth?: string
  errorHandleId?: string | null
  viewMode?: 'single' | 'all'
  onViewModeChange?: (mode: 'single' | 'all') => void
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
}

