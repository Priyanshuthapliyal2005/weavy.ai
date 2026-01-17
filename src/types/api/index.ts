import { NextResponse } from 'next/server'

export interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export interface LLMRequest {
  model: string
  systemPrompt?: string
  userMessage: string
  images?: string[]
  temperature?: number
  thinking?: boolean
}

export interface LLMResponse {
  output: string
  error?: string
}

