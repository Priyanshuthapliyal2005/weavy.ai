'use client';

import type React from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { Upload, Grid, Square, Loader2, X } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import toast from 'react-hot-toast';
import { BaseNode } from './base-node';
import { HANDLE_COLORS } from '@/constants/colors';
import { HANDLE_IDS } from '@/constants/node-ids';
import { NODE_MIN_WIDTH, NODE_MAX_WIDTH } from '@/constants/ui';
import { readFileAsDataURL } from '@/helpers/file-handling';

type ImageNode = Node<
  {
    label: string;
    imageUrl: string | null;
    imageFile: File | null;
    images?: Array<{ id: string; url: string; file: File | null }>;
    viewMode?: 'single' | 'all';
  },
  'image'
>;

function ImageNodeComponent({ id, data, selected }: NodeProps<ImageNode>) {
  const { updateNodeData } = useWorkflowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileLink, setFileLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const viewMode = data?.viewMode || 'single';
  const images =
    data?.images ||
    (data.imageUrl
      ? [{ id: '1', url: data.imageUrl, file: data.imageFile }]
      : []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsUploading(true);
        const toastId = toast.loading('Uploading image...');
        
        try {
          // Upload to Transloadit
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'image');
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          const { url } = await response.json();
          
          const newImage = {
            id: Date.now().toString(),
            url: url,
            file: null, // Clear file after upload
          };
          const updatedImages = [...images, newImage];
          updateNodeData(id, {
            images: updatedImages,
            imageUrl: updatedImages[0]?.url || null,
            imageFile: null,
            viewMode: viewMode,
          });
          
          toast.success('Image uploaded!', { id: toastId });
        } catch (error) {
          console.error('Failed to upload file:', error);
          toast.error('Upload failed', { id: toastId });
        } finally {
          setIsUploading(false);
        }
      }
    },
    [id, updateNodeData, images, viewMode]
  );

  const handleRemoveImage = useCallback(
    (imageId: string) => {
      const updatedImages = images.filter((img) => img.id !== imageId);
      updateNodeData(id, {
        images: updatedImages,
        imageUrl: updatedImages[0]?.url || null,
        imageFile: updatedImages[0]?.file || null,
        viewMode: viewMode,
      });
    },
    [id, updateNodeData, images, viewMode]
  );

  const handleClearAll = useCallback(() => {
    updateNodeData(id, {
      images: [],
      imageUrl: null,
      imageFile: null,
      viewMode: 'single',
    });
  }, [id, updateNodeData]);

  const handleLinkSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (fileLink.trim()) {
        const newImage = {
          id: Date.now().toString(),
          url: fileLink.trim(),
          file: null,
        };
        const updatedImages = [...images, newImage];
        updateNodeData(id, {
          images: updatedImages,
          imageUrl: updatedImages[0]?.url || null,
          imageFile: null,
          viewMode: viewMode,
        });
        setFileLink('');
      }
    },
    [fileLink, id, updateNodeData, images, viewMode]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        try {
          const dataUrl = await readFileAsDataURL(file);
          const newImage = {
            id: Date.now().toString(),
            url: dataUrl,
            file: file,
          };
          const updatedImages = [...images, newImage];
          updateNodeData(id, {
            images: updatedImages,
            imageUrl: updatedImages[0]?.url || null,
            imageFile: updatedImages[0]?.file || null,
            viewMode: viewMode,
          });
        } catch (error) {
          console.error('Failed to read dropped file:', error);
        }
      }
    },
    [id, updateNodeData, images, viewMode]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleViewModeChange = useCallback(
    (mode: 'single' | 'all') => {
      updateNodeData(id, { viewMode: mode });
    },
    [id, updateNodeData]
  );

  const currentImage = images.length > 0 ? images[0] : null;
  const displayImages =
    viewMode === 'all' ? images : currentImage ? [currentImage] : [];

  return (
    <BaseNode
      id={id}
      selected={selected}
      title='Image Iterator'
      nodeType='image'
      data={data}
      inputHandles={[]}
      outputHandles={[{ id: HANDLE_IDS.OUTPUT, color: HANDLE_COLORS.image }]}
      minWidth={NODE_MIN_WIDTH}
      maxWidth={NODE_MAX_WIDTH}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
    >
      <div className='flex flex-col gap-3'>
        {images.length > 0 ? (
          <>
            <div className='relative w-full h-90 rounded-lg border border-panel-border overflow-hidden bg-[#353539]'>
              <div className='absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none'>
                <button
                  onClick={() =>
                    handleViewModeChange(
                      viewMode === 'single' ? 'all' : 'single'
                    )
                  }
                  className='p-1.5 rounded bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 text-white transition-colors cursor-pointer pointer-events-auto'
                  title={viewMode === 'single' ? 'Show all' : 'Show single'}
                >
                  {viewMode === 'single' ? (
                    <Grid className='w-4 h-4' />
                  ) : (
                    <Square className='w-4 h-4' />
                  )}
                </button>
                {viewMode === 'all' && images.length > 0 ? (
                  <button
                    onClick={handleClearAll}
                    className='p-1.5 rounded bg-red-500/70 backdrop-blur-sm border border-red-400/40 hover:bg-red-500 text-white transition-colors cursor-pointer pointer-events-auto'
                    title='Remove all'
                  >
                    <X className='w-4 h-4' />
                  </button>
                ) : currentImage ? (
                  <button
                    onClick={() => handleRemoveImage(currentImage.id)}
                    className='p-1.5 rounded bg-red-500/70 backdrop-blur-sm border border-red-400/40 hover:bg-red-500 text-white transition-colors cursor-pointer pointer-events-auto'
                    title='Remove image'
                  >
                    <X className='w-4 h-4' />
                  </button>
                ) : null}
              </div>

              {viewMode === 'all' && images.length > 1 ? (
                <div className='grid grid-cols-2 gap-2 p-2 pt-12 min-h-90'>
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className='relative group aspect-square bg-[#212126] rounded border border-panel-border overflow-hidden flex items-center justify-center'
                    >
                      <button
                        type='button'
                        onClick={() => handleRemoveImage(img.id)}
                        className='absolute top-2 right-2 z-10 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100'
                        title='Remove image'
                      >
                        <X size={14} />
                      </button>
                      <img
                        src={img.url}
                        alt='Uploaded'
                        className='max-w-full max-h-full object-contain'
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className='relative group w-full h-90 flex items-center justify-center'>
                  {currentImage && (
                    <img
                      src={currentImage.url}
                      alt='Uploaded'
                      className='w-full h-full object-contain'
                    />
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className='text-left text-[10px] text-white/70 hover:text-white transition-colors cursor-pointer inline-block'
            >
              <span className='hover:bg-white/5 rounded px-2 py-1 transition-colors'>
                + Add more images
              </span>
            </button>
          </>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={
              'w-full min-h-90 bg-[#353539] rounded-lg border border-panel-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/20 transition-colors relative overflow-hidden ' +
              (isUploading ? 'opacity-50 pointer-events-none' : '')
            }
          >
            {isUploading ? (
              <Loader2 className='w-6 h-6 text-white animate-spin' />
            ) : (
              <Upload className='w-6 h-6 text-white' />
            )}
            <span className='text-sm text-white/70'>
              {isUploading ? 'Uploading...' : 'Drag & drop or click to upload'}
            </span>
          </div>
        )}

        {images.length === 0 && (
          <form onSubmit={handleLinkSubmit} className='w-full'>
            <input
              type='text'
              value={fileLink}
              onChange={(e) => setFileLink(e.target.value)}
              placeholder='Paste a file link'
              className='w-full bg-transparent border border-panel-border rounded-md py-1.5 px-4 text-xs text-panel-text placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors cursor-text'
            />
          </form>
        )}
      </div>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileUpload}
        className='hidden'
        multiple
        aria-label='Upload image'
      />
    </BaseNode>
  );
}

export const ImageNode = memo(ImageNodeComponent)
