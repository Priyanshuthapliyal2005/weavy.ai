'use client';

import React, { memo, useCallback, useRef, useState } from 'react';
import { type Node, type NodeProps, Handle, Position } from '@xyflow/react';
import { Video, Upload, X } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { BaseNode } from './base-node';
import { HANDLE_COLORS } from '@/constants/colors';
import { HANDLE_IDS } from '@/constants/node-ids';

type VideoNode = Node<
  {
    label: string;
    videoUrl: string | null;
    videoFile: File | null;
    viewMode?: 'single' | 'all';
  },
  'video'
>;

function VideoNodeComponent({ id, data, selected }: NodeProps<VideoNode>) {
  const { updateNodeData } = useWorkflowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('video/')) {
        console.error('Invalid file type. Please upload a video file.');
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      updateNodeData(id, {
        videoUrl,
        videoFile: file,
      });
    },
    [id, updateNodeData]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files?.[0];
      if (file) {
        await handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemoveVideo = useCallback(() => {
    if (data.videoUrl) {
      URL.revokeObjectURL(data.videoUrl);
    }
    updateNodeData(id, {
      videoUrl: null,
      videoFile: null,
    });
  }, [id, data.videoUrl, updateNodeData]);

  const inputHandles = [];
  const outputHandles = [
    {
      id: HANDLE_IDS.OUTPUT,
      label: 'video',
      color: HANDLE_COLORS.VIDEO,
      position: 'right' as const,
    },
  ];

  return (
    <BaseNode
      id={id}
      label={data.label || 'Upload Video'}
      icon={<Video size={16} />}
      color="#10b981"
      selected={selected}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    >
      <div className="p-4 space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/mov,video/webm,video/m4v"
          onChange={handleFileUpload}
          className="hidden"
        />

        {!data.videoUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 
              flex flex-col items-center justify-center gap-2
              cursor-pointer transition-all
              ${isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <Upload size={32} className="text-gray-400" />
            <p className="text-sm text-gray-600 text-center">
              Drop video here or click to upload
            </p>
            <p className="text-xs text-gray-400">
              Supports: MP4, MOV, WEBM, M4V
            </p>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleRemoveVideo}
              className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              title="Remove video"
            >
              <X size={14} />
            </button>
            <video
              src={data.videoUrl}
              controls
              className="w-full rounded-lg max-h-64"
            />
            {data.videoFile && (
              <p className="text-xs text-gray-500 mt-2 truncate">
                {data.videoFile.name}
              </p>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const VideoNode = memo(VideoNodeComponent);
