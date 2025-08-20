import { Variants, Transition } from 'framer-motion'

// Spring configurations for consistent animations
export const springConfigs = {
  // Fast, snappy interactions (buttons, toggles)
  fast: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
    mass: 0.8
  },
  
  // Standard interactions (hover, focus)
  standard: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1
  },
  
  // Smooth, elegant transitions (page transitions, panels)
  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
    mass: 1.2
  },
  
  // Gentle, subtle animations (micro-interactions)
  gentle: {
    type: 'spring' as const,
    stiffness: 150,
    damping: 20,
    mass: 1.5
  }
}

// Duration-based transitions for fallback
export const durationConfigs = {
  fast: { duration: 0.15 },
  standard: { duration: 0.25 },
  smooth: { duration: 0.35 },
  gentle: { duration: 0.5 }
}

// Common animation variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

export const slideVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: springConfigs.fast
  }
}

export const scaleVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.8
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    transition: springConfigs.fast
  }
}

export const slideInVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: -20
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    x: 20,
    transition: springConfigs.fast
  }
}

export const slideUpVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: springConfigs.fast
  }
}

export const expandVariants: Variants = {
  hidden: { 
    opacity: 0,
    height: 0,
    scaleY: 0
  },
  visible: { 
    opacity: 1,
    height: 'auto',
    scaleY: 1,
    transition: {
      ...springConfigs.smooth,
      opacity: { duration: 0.2 },
      height: { duration: 0.3 },
      scaleY: { duration: 0.25 }
    }
  },
  exit: { 
    opacity: 0,
    height: 0,
    scaleY: 0,
    transition: {
      ...springConfigs.fast,
      opacity: { duration: 0.15 },
      height: { duration: 0.2 },
      scaleY: { duration: 0.15 }
    }
  }
}

// Hover and tap animations
export const hoverVariants: Variants = {
  hover: { 
    scale: 1.05,
    transition: springConfigs.fast
  },
  tap: { 
    scale: 0.95,
    transition: springConfigs.fast
  }
}

export const buttonHoverVariants: Variants = {
  hover: { 
    scale: 1.02,
    y: -1,
    transition: springConfigs.fast
  },
  tap: { 
    scale: 0.98,
    y: 0,
    transition: springConfigs.fast
  }
}

export const cardHoverVariants: Variants = {
  hover: { 
    y: -2,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    transition: springConfigs.standard
  },
  tap: { 
    y: 0,
    scale: 0.98,
    transition: springConfigs.fast
  }
}

// List item animations
export const listItemVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: -20,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: springConfigs.fast
  }
}

// Stagger animations for lists
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

// Notification animations
export const notificationVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: -50,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    y: -50,
    scale: 0.95,
    transition: springConfigs.fast
  }
}

// Modal/overlay animations
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.smooth
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: springConfigs.fast
  }
}

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 }
  }
}

// Progress bar animations
export const progressVariants: Variants = {
  hidden: { width: '0%' },
  visible: { 
    width: '100%',
    transition: springConfigs.smooth
  }
}

// Timeline animations
export const timelineVariants: Variants = {
  hidden: { 
    opacity: 0,
    scaleX: 0
  },
  visible: { 
    opacity: 1,
    scaleX: 1,
    transition: springConfigs.smooth
  }
}

// Tree node animations
export const treeNodeVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: -10,
    height: 0
  },
  visible: { 
    opacity: 1,
    x: 0,
    height: 'auto',
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    x: -10,
    height: 0,
    transition: springConfigs.fast
  }
}

// Search result animations
export const searchResultVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 10,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.standard
  },
  exit: { 
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: springConfigs.fast
  }
}

// Theme transition
export const themeTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1]
}

// Utility functions
export const createStaggerDelay = (index: number, staggerDelay: number = 0.1) => ({
  delay: index * staggerDelay
})

export const createSpringTransition = (config: keyof typeof springConfigs = 'standard') => 
  springConfigs[config]

export const createDurationTransition = (config: keyof typeof durationConfigs = 'standard') => 
  durationConfigs[config]
