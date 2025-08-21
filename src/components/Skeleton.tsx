'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export default function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = 'md' 
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }

  return (
    <motion.div
      className={`bg-muted/50 animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width,
        height: height
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  )
}

// Predefined skeleton components
export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={24} />
        <Skeleton width={100} height={32} />
      </div>
      <div className="space-y-3">
        <Skeleton width="100%" height={20} />
        <Skeleton width="90%" height={20} />
        <Skeleton width="95%" height={20} />
        <Skeleton width="85%" height={20} />
      </div>
    </div>
  )
}

export function DiffSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton width={150} height={20} />
          <Skeleton width={80} height={32} />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton width="100%" height={16} />
            <Skeleton width="95%" height={16} />
            <Skeleton width="90%" height={16} />
            <Skeleton width="98%" height={16} />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton width="100%" height={16} />
            <Skeleton width="92%" height={16} />
            <Skeleton width="88%" height={16} />
            <Skeleton width="96%" height={16} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function UploadSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto">
          <Skeleton width={64} height={64} rounded="full" />
        </div>
        <div className="space-y-2">
          <Skeleton width={200} height={20} className="mx-auto" />
          <Skeleton width={300} height={16} className="mx-auto" />
        </div>
        <div className="flex justify-center gap-3">
          <Skeleton width={120} height={40} />
          <Skeleton width={120} height={40} />
        </div>
      </div>
    </div>
  )
}

export function VersionListSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="space-y-4">
        <Skeleton width={180} height={24} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-md">
              <Skeleton width={40} height={40} rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton width={150} height={16} />
                <Skeleton width={200} height={12} />
              </div>
              <Skeleton width={60} height={32} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SessionBarSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton width={120} height={20} />
          <Skeleton width={100} height={32} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width={80} height={32} />
          <Skeleton width={80} height={32} />
          <Skeleton width={80} height={32} />
        </div>
      </div>
    </div>
  )
}

export function EmptyStateSkeleton() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4">
        <Skeleton width={64} height={64} rounded="full" />
      </div>
      <div className="space-y-2">
        <Skeleton width={200} height={24} className="mx-auto" />
        <Skeleton width={400} height={16} className="mx-auto" />
      </div>
    </div>
  )
}
