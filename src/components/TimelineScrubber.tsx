'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, useAppSelectors } from '@/state/store'
import { 
  slideVariants, 
  buttonHoverVariants,
  listItemVariants,
  staggerContainerVariants,
  springConfigs 
} from '@/utils/motion'

interface TimelineScrubberProps {
  className?: string
}

function TimelineScrubber({ className = '' }: TimelineScrubberProps) {
  const { versions, selection, setTimelineIndex } = useAppStore()
  const activePair = useAppSelectors.useActivePair()
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000) // milliseconds between transitions
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Get current timeline index with validation
  const currentIndex = (() => {
    if (selection.mode === 'timeline') {
      const index = selection.index
      // Validate the index is a number and within bounds
      if (typeof index === 'number' && !isNaN(index) && index >= 0 && index < versions.length) {
        return index
      }
      // If invalid, default to 0
      return 0
    }
    return 0
  })()

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Handle play/pause functionality
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      if (versions.length < 2) return
      
      setIsPlaying(true)
      playIntervalRef.current = setInterval(() => {
        const nextIndex = currentIndex + 1
        if (nextIndex >= versions.length - 1) {
          // Reached the end, stop playing
          setIsPlaying(false)
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current)
            playIntervalRef.current = null
          }
          setTimelineIndex(versions.length - 1)
        } else {
          setTimelineIndex(nextIndex)
        }
      }, playSpeed)
    }
  }, [isPlaying, versions.length, playSpeed, setTimelineIndex])

  // Handle direct click on timeline stop
  const handleStopClick = useCallback((index: number) => {
    setTimelineIndex(index)
    
    // Stop playing if currently playing
    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
      setIsPlaying(false)
    }
  }, [setTimelineIndex, isPlaying])

  // Handle drag/scrub on timeline
  const handleTimelineDrag = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || versions.length < 2) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newIndex = Math.round(percentage * (versions.length - 1))
    
    setTimelineIndex(newIndex)
  }, [versions.length, setTimelineIndex])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return // Only handle when not focused on input
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          setTimelineIndex(Math.max(0, currentIndex - 1))
          break
        case 'ArrowRight':
          event.preventDefault()
          setTimelineIndex(Math.min(versions.length - 1, currentIndex + 1))
          break
        case ' ':
          event.preventDefault()
          togglePlay()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, versions.length, setTimelineIndex, togglePlay])

  if (versions.length < 2) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">
          Add at least 2 JSON versions to see the timeline
        </p>
      </div>
    )
  }

  const progressPercentage = versions.length > 1 ? (currentIndex / (versions.length - 1)) * 100 : 0

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      transition={springConfigs.standard}
    >
      {/* Controls */}
      <motion.div 
        className="flex items-center justify-between"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={togglePlay}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            transition={springConfigs.fast}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </motion.button>

          <div className="text-sm text-gray-600">
            <span className="font-medium">
              {Math.max(1, currentIndex + 1)} of {Math.max(1, versions.length)}
            </span>
            {activePair && (
              <span className="ml-2 text-gray-500">
                (comparing versions {Math.max(1, currentIndex + 1)} → {Math.max(1, currentIndex + 2)})
              </span>
            )}
          </div>
        </div>

        {/* Speed Control */}
        <motion.div 
          className="flex items-center space-x-2 text-sm"
          variants={listItemVariants}
        >
          <label htmlFor="speed-control" className="text-gray-600">Speed:</label>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileFocus={{ scale: 1.02 }}
            transition={springConfigs.fast}
          >
            <select
              id="speed-control"
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2000}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={250}>4x</option>
            </select>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Timeline Track */}
      <motion.div 
        className="relative"
        variants={listItemVariants}
      >
        <motion.div
          ref={timelineRef}
          className="relative h-12 bg-gray-200 rounded-full cursor-pointer select-none"
          onClick={handleTimelineDrag}
          onMouseMove={(e) => {
            if (e.buttons === 1) { // Left mouse button is pressed
              handleTimelineDrag(e)
            }
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={versions.length - 1}
          aria-valuenow={currentIndex}
          aria-label="Timeline scrubber"
          tabIndex={0}
          whileHover={{ scale: 1.02 }}
          transition={springConfigs.fast}
        >
          {/* Progress Track */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          {/* Version Stops */}
          {versions.map((version, index) => (
            <motion.button
              key={version.id}
              className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                index === currentIndex
                  ? 'bg-blue-600 border-white shadow-lg'
                  : index <= currentIndex
                  ? 'bg-blue-400 border-white'
                  : 'bg-white border-gray-300 hover:border-gray-400'
              }`}
              style={{
                left: `${versions.length > 1 ? (index / (versions.length - 1)) * 100 : 0}%`,
                marginLeft: '-12px' // Half of button width to center it
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleStopClick(index)
              }}
              aria-label={`Go to version ${index + 1}: ${version.label}`}
              title={`${version.label} - ${formatTimestamp(version.timestamp)}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: index === currentIndex ? 1.25 : 1,
                opacity: 1
              }}
              whileHover={{ scale: index === currentIndex ? 1.3 : 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ 
                delay: index * 0.1,
                ...springConfigs.fast 
              }}
            />
          ))}

          {/* Playhead */}
          <motion.div
            className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg pointer-events-none"
            style={{
              left: `${progressPercentage}%`,
              marginLeft: '-2px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
        </motion.div>
      </motion.div>

      {/* Version Labels */}
      <motion.div 
        className="relative h-16"
        variants={listItemVariants}
      >
        <AnimatePresence mode="wait">
          {versions.map((version, index) => {
            const isActive = index === currentIndex
            const isNextActive = index === currentIndex + 1 && activePair
            
            if (!isActive && !isNextActive) return null
            
            return (
              <motion.div
                key={`${version.id}-${index}`}
                className={`absolute top-0 ${
                  isActive ? 'left-0' : 'right-0'
                } max-w-xs`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ ...springConfigs.smooth }}
              >
                <div className={`p-3 rounded-lg border ${
                  isActive 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <span className="text-xs font-medium text-gray-600">
                      {isActive ? 'From' : 'To'}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {version.label}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(version.timestamp)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {version.source.type === 'file' && `File: ${version.source.ref}`}
                    {version.source.type === 'url' && `URL: ${version.source.ref}`}
                    {version.source.type === 'paste' && 'Pasted content'}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Keyboard Shortcuts Help */}
      <motion.div 
        className="text-xs text-gray-500 text-center"
        variants={listItemVariants}
      >
        Use ← → arrow keys to navigate, Space to play/pause
      </motion.div>
    </motion.div>
  )
}

export default TimelineScrubber
