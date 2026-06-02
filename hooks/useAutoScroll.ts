/**
 * file: useAutoScroll.ts
 * description: 文件 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [file]
 *
 * brief: 待补充简要说明
 *
 * details: 待补充详细说明
 *
 * dependencies: 待补充
 * exports: 待补充
 * notes: 待补充
 */

/**
 * YYC³ AI Family - Auto Scroll Hook
 * 
 * Extracted scroll behavior logic from CommunicationLog component
 * Provides automatic scrolling to bottom when new messages arrive
 * 
 * Supports:
 * - Auto-scroll on content changes
 * - Scroll-to-bottom trigger
 * - Smooth scroll behavior
 * - Customizable dependencies
 */

import { useRef, useEffect, useCallback } from 'react';

export interface UseAutoScrollOptions {
  /**
   * Dependencies that should trigger auto-scroll
   * Typically an array of message IDs or message count
   */
  dependencies: React.DependencyList;
  
  /**
   * Scroll behavior
   * @default 'auto'
   */
  behavior?: ScrollBehavior;
  
  /**
   * Delay before scrolling (ms)
   * Useful for animations to complete
   * @default 0
   */
  delay?: number;
  
  /**
   * Enable/disable auto-scroll
   * @default true
   */
  enabled?: boolean;
}

export interface UseAutoScrollReturn<T extends HTMLElement = HTMLDivElement> {
  /**
   * Ref to attach to the scrollable container
   */
  scrollRef: React.RefObject<T>;
  
  /**
   * Manually trigger scroll to bottom
   */
  scrollToBottom: (options?: { behavior?: ScrollBehavior; delay?: number }) => void;
  
  /**
   * Manually trigger scroll to top
   */
  scrollToTop: (options?: { behavior?: ScrollBehavior; delay?: number }) => void;
  
  /**
   * Check if currently scrolled to bottom
   */
  isAtBottom: () => boolean;
}

/**
 * useAutoScroll Hook
 * 
 * @example
 * ```tsx
 * const { scrollRef, scrollToBottom } = useAutoScroll({
 *   dependencies: [messages],
 *   behavior: 'smooth',
 *   delay: 100,
 * });
 * 
 * return (
 *   <div ref={scrollRef} className="overflow-y-auto">
 *     {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *   </div>
 * );
 * ```
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoScrollOptions
): UseAutoScrollReturn<T> {
  const {
    dependencies,
    behavior = 'auto',
    delay = 0,
    enabled = true,
  } = options;

  const scrollRef = useRef<T>(null);

  /**
   * Scroll to bottom of the container
   */
  const scrollToBottom = useCallback((scrollOptions?: { behavior?: ScrollBehavior; delay?: number }) => {
    const element = scrollRef.current;
    if (!element) return;

    const scrollDelay = scrollOptions?.delay ?? delay;

    const performScroll = () => {
      element.scrollTop = element.scrollHeight;
      // Alternative: element.scrollTo({ top: element.scrollHeight, behavior: scrollBehavior });
    };

    if (scrollDelay > 0) {
      setTimeout(performScroll, scrollDelay);
    } else {
      performScroll();
    }
  }, [behavior, delay]);

  /**
   * Scroll to top of the container
   */
  const scrollToTop = useCallback((scrollOptions?: { behavior?: ScrollBehavior; delay?: number }) => {
    const element = scrollRef.current;
    if (!element) return;

    const scrollDelay = scrollOptions?.delay ?? delay;

    const performScroll = () => {
      element.scrollTop = 0;
      // Alternative: element.scrollTo({ top: 0, behavior: scrollBehavior });
    };

    if (scrollDelay > 0) {
      setTimeout(performScroll, scrollDelay);
    } else {
      performScroll();
    }
  }, [behavior, delay]);

  /**
   * Check if scrolled to bottom (within 50px threshold)
   */
  const isAtBottom = useCallback((): boolean => {
    const element = scrollRef.current;
    if (!element) return false;

    const threshold = 50;
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
  }, []);

  /**
   * Auto-scroll effect
   * Triggered when dependencies change
   */
  useEffect(() => {
    if (!enabled) return;

    scrollToBottom();
  }, [enabled, scrollToBottom, ...dependencies]);

  return {
    scrollRef,
    scrollToBottom,
    scrollToTop,
    isAtBottom,
  };
}

/**
 * useAutoScrollReverse Hook
 * 
 * Special variant for flex-col-reverse layouts (like CommunicationLog)
 * In this layout, scrollTop should be maintained at 0 for newest messages
 * 
 * @example
 * ```tsx
 * const { scrollRef } = useAutoScrollReverse({
 *   dependencies: [messages],
 * });
 * 
 * return (
 *   <div ref={scrollRef} className="flex flex-col-reverse overflow-y-auto">
 *     {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *   </div>
 * );
 * ```
 */
export function useAutoScrollReverse<T extends HTMLElement = HTMLDivElement>(
  options: Omit<UseAutoScrollOptions, 'behavior'>
): Pick<UseAutoScrollReturn<T>, 'scrollRef'> {
  const { dependencies, delay = 0, enabled = true } = options;
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = scrollRef.current;
    if (!element) return;

    const performScroll = () => {
      // For flex-col-reverse, keep scrollTop at 0 to show newest messages
      element.scrollTop = 0;
    };

    if (delay > 0) {
      setTimeout(performScroll, delay);
    } else {
      performScroll();
    }
  }, [enabled, delay, ...dependencies]);

  return { scrollRef };
}
