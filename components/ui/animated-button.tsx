/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { motion, useAnimation } from "framer-motion";
import React, { useRef, isValidElement } from "react";
import { cn } from "@/lib/utils/cn";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  variant?: "default" | "outline" | "white";
  size?: "default" | "sm" | "xs";
}

const variantConfig = {
  default: {
    container: "bg-primary border-primary",
    fill: "bg-primary-foreground",
    textInitial: "hsl(var(--primary-foreground))",
    textHover: "hsl(var(--primary))",
  },
  outline: {
    container: "bg-transparent border-primary",
    fill: "bg-primary",
    textInitial: "hsl(var(--primary))",
    textHover: "hsl(var(--primary-foreground))",
  },
  white: {
    container: "bg-transparent border-white!",
    fill: "bg-white",
    textInitial: "white",
    textHover: "hsl(var(--foreground))",
  },
} as const;

const sizeConfig = {
  default: "px-8 py-3.5 text-base",
  sm: "px-6 py-3",
  xs: "px-4 py-2 text-sm",
} as const;

export function AnimatedButton({
  children,
  className = "",
  asChild = false,
  variant = "default",
  size = "default",
  ...props
}: AnimatedButtonProps) {
  const bgControls = useAnimation();
  const textControls = useAnimation();
  const isHovered = useRef(false);

  const config = variantConfig[variant];

  const handleMouseEnter = async () => {
    isHovered.current = true;
    bgControls.stop();

    textControls.start({
      color: config.textHover,
      transition: { duration: 0.3 },
    });

    bgControls.set({
      y: "100%",
      borderTopLeftRadius: "50%",
      borderTopRightRadius: "50%",
      borderBottomLeftRadius: "0%",
      borderBottomRightRadius: "0%",
    });

    await bgControls.start({
      y: "0%",
      borderTopLeftRadius: "50%",
      borderTopRightRadius: "50%",
      transition: { ease: [0.25, 1, 0.5, 1], duration: 0.3 },
    });

    if (isHovered.current) {
      bgControls.start({
        borderTopLeftRadius: "0%",
        borderTopRightRadius: "0%",
        transition: { ease: "easeIn", duration: 0.15 },
      });
    }
  };

  const handleMouseLeave = async () => {
    isHovered.current = false;
    bgControls.stop();

    textControls.start({
      color: config.textInitial,
      transition: { duration: 0.3, delay: 0.1 },
    });

    bgControls.set({
      borderTopLeftRadius: "0%",
      borderTopRightRadius: "0%",
      borderBottomLeftRadius: "50%",
      borderBottomRightRadius: "50%",
    });

    await bgControls.start({
      y: "-100%",
      borderBottomLeftRadius: "50%",
      borderBottomRightRadius: "50%",
      transition: { ease: [0.25, 1, 0.5, 1], duration: 0.5 },
    });
  };

  // Filter out event handlers that conflict with framer-motion
  const {
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...safeProps
  } = props as any;

  const motionProps = {
    whileTap: { scale: 0.98 },
  };

  const eventHandlers = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter,
    onBlur: handleMouseLeave,
  };

  const baseClassName = cn(
    "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-[6px] border-2 border-primary! whitespace-nowrap w-fit",
    config.container,
    sizeConfig[size],
    className,
  );

  const content = (
    <>
      {/* Background fill */}
      <motion.div
        initial={{
          y: "100%",
          borderTopLeftRadius: "50%",
          borderTopRightRadius: "50%",
        }}
        animate={bgControls}
        className={cn(
          "absolute -inset-x-[20%] top-0 h-[150%] w-[140%] pointer-events-none",
          config.fill,
        )}
      />

      {/* Button content */}
      <motion.span
        initial={{ color: config.textInitial }}
        animate={textControls}
        className="relative z-10 flex items-center justify-center gap-2.5 whitespace-nowrap"
      >
        {children}
      </motion.span>
    </>
  );

  // If asChild is true, render child with styles applied directly
  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    
    // Clone the child element and wrap the content with our animations
    const childProps = child.props;
    const originalClassName = childProps.className || '';
    
    return React.cloneElement(child, {
      className: cn(
        "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-[6px] border-2 border-primary! whitespace-nowrap w-fit",
        config.container,
        sizeConfig[size],
        className,
        originalClassName,
      ),
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      children: (
        <>
          {/* Background fill */}
          <motion.div
            initial={{
              y: "100%",
              borderTopLeftRadius: "50%",
              borderTopRightRadius: "50%",
            }}
            animate={bgControls}
            className={cn(
              "absolute -inset-x-[20%] top-0 h-[150%] w-[140%] pointer-events-none",
              config.fill,
            )}
          />
          {/* Button content */}
          <motion.span
            initial={{ color: config.textInitial }}
            animate={textControls}
            className="relative z-10 flex items-center justify-center gap-2.5 whitespace-nowrap"
          >
            {childProps.children}
          </motion.span>
        </>
      ),
    });
  }

  return (
    <motion.button
      {...motionProps}
      {...eventHandlers}
      className={baseClassName}
      {...safeProps}
    >
      {content}
    </motion.button>
  );
}
