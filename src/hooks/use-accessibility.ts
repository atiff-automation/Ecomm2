/**
 * Accessibility Hook - Malaysian E-commerce Platform
 * React hooks for accessibility features and WCAG compliance
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createFocusTrap,
  announceToScreenReader,
  moveFocus,
  KeyboardKeys,
  generateFormFieldIds,
  getFormFieldAriaAttributes,
  getLoadingAriaAttributes,
} from '@/lib/utils/accessibility';

// Focus trap hook
export function useFocusTrap(isActive: boolean = false) {
  const elementRef = useRef<HTMLElement>(null);
  const focusTrapRef = useRef<{
    activate: () => void;
    deactivate: () => void;
  } | null>(null);

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }

    if (isActive) {
      focusTrapRef.current = createFocusTrap(elementRef.current);
      focusTrapRef.current.activate();
    } else {
      focusTrapRef.current?.deactivate();
      focusTrapRef.current = null;
    }

    return () => {
      focusTrapRef.current?.deactivate();
    };
  }, [isActive]);

  return elementRef;
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  handlers: Partial<Record<keyof typeof KeyboardKeys, () => void>>,
  deps: React.DependencyList = []
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key as keyof typeof KeyboardKeys;
    const handler = handlers[key];

    if (handler) {
      event.preventDefault();
      handler();
    }
  }, deps);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Screen reader announcements hook
export function useScreenReaderAnnouncements() {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announceToScreenReader(message, priority);
    },
    []
  );

  return { announce };
}

// Skip to content hook
export function useSkipToContent(targetId: string) {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId]);

  return { skipToContent };
}

// Form field accessibility hook
export function useFormFieldAccessibility(
  fieldName: string,
  options: {
    required?: boolean;
    hasError?: boolean;
    hasHelp?: boolean;
    errorMessage?: string;
    helpText?: string;
  } = {}
) {
  const {
    required = false,
    hasError = false,
    hasHelp = false,
    errorMessage,
    helpText,
  } = options;
  const ids = generateFormFieldIds(fieldName);

  const fieldProps = getFormFieldAriaAttributes(fieldName, {
    hasError,
    hasHelp,
    required,
    invalid: hasError,
  });

  const labelProps = {
    id: ids.labelId,
    htmlFor: ids.fieldId,
  };

  const errorProps = hasError
    ? {
        id: ids.errorId,
        role: 'alert',
        'aria-live': 'assertive' as const,
        'aria-atomic': true,
      }
    : {};

  const helpProps = hasHelp
    ? {
        id: ids.helpId,
        'aria-live': 'polite' as const,
      }
    : {};

  return {
    fieldProps,
    labelProps,
    errorProps,
    helpProps,
    ids,
  };
}

// Loading state accessibility hook
export function useLoadingAccessibility(
  isLoading: boolean,
  loadingText: string = 'Loading content, please wait...'
) {
  const { announce } = useScreenReaderAnnouncements();

  useEffect(() => {
    if (isLoading) {
      announce(loadingText, 'polite');
    }
  }, [isLoading, loadingText, announce]);

  const loadingProps = getLoadingAriaAttributes(isLoading, loadingText);

  return { loadingProps };
}

// Modal/Dialog accessibility hook
export function useModalAccessibility(
  isOpen: boolean,
  options: {
    titleId?: string;
    descriptionId?: string;
    closeOnEscape?: boolean;
    onClose?: () => void;
    restoreFocus?: boolean;
  } = {}
) {
  const {
    titleId,
    descriptionId,
    closeOnEscape = true,
    onClose,
    restoreFocus = true,
  } = options;

  const modalRef = useFocusTrap(isOpen);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen, restoreFocus]);

  // Handle escape key
  useKeyboardNavigation(
    {
      Escape: closeOnEscape && onClose ? onClose : undefined,
    },
    [closeOnEscape, onClose]
  );

  const modalProps = {
    ref: modalRef,
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
  };

  return { modalProps };
}

// Roving tabindex for lists/grids hook
export function useRovingTabIndex<T extends HTMLElement>(
  items: T[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  const [activeIndex, setActiveIndex] = useState(0);

  const moveToNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % items.length);
  }, [items.length]);

  const moveToPrevious = useCallback(() => {
    setActiveIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const moveToFirst = useCallback(() => {
    setActiveIndex(0);
  }, []);

  const moveToLast = useCallback(() => {
    setActiveIndex(items.length - 1);
  }, [items.length]);

  const keyHandlers =
    orientation === 'horizontal'
      ? {
          ArrowRight: moveToNext,
          ArrowLeft: moveToPrevious,
          Home: moveToFirst,
          End: moveToLast,
        }
      : {
          ArrowDown: moveToNext,
          ArrowUp: moveToPrevious,
          Home: moveToFirst,
          End: moveToLast,
        };

  useKeyboardNavigation(keyHandlers, [
    moveToNext,
    moveToPrevious,
    moveToFirst,
    moveToLast,
  ]);

  useEffect(() => {
    if (items[activeIndex]) {
      items[activeIndex].focus();
    }
  }, [activeIndex, items]);

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
    }),
    [activeIndex]
  );

  return {
    activeIndex,
    setActiveIndex,
    getItemProps,
  };
}

// Aria live region hook
export function useAriaLive(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    if (message) {
      setLiveMessage(message);
      // Clear the message after it's been announced
      const timer = setTimeout(() => setLiveMessage(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const liveRegionProps = {
    'aria-live': priority,
    'aria-atomic': true,
    'aria-relevant': 'additions text',
    className: 'sr-only',
  };

  return {
    liveMessage,
    liveRegionProps,
  };
}

// Reduced motion detection hook
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// High contrast mode detection hook
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
}

// Color scheme preference hook
export function useColorSchemePreference() {
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDark(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersDark;
}

// Focus visible hook (for custom focus indicators)
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const handleFocus = () => setIsFocusVisible(true);
    const handleBlur = () => setIsFocusVisible(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };
    const handleMouseDown = () => setIsFocusVisible(false);

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('keydown', handleKeyDown);
    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
      element.removeEventListener('keydown', handleKeyDown);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isFocusVisible, ref: elementRef };
}

// Auto-scroll for keyboard navigation
export function useAutoScroll(
  activeIndex: number,
  containerRef: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const activeElement = container.children[activeIndex] as HTMLElement;
    if (!activeElement) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const elementRect = activeElement.getBoundingClientRect();

    const isVisible =
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom;

    if (!isVisible) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex, containerRef]);
}

// Accessible form submission hook
export function useAccessibleFormSubmission(
  onSubmit: (data: any) => Promise<void> | void,
  options: {
    successMessage?: string;
    errorMessage?: string;
  } = {}
) {
  const { announce } = useScreenReaderAnnouncements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = useCallback(
    async (data: any) => {
      setIsSubmitting(true);
      announce('Submitting form, please wait...', 'polite');

      try {
        await onSubmit(data);
        announce(
          options.successMessage || 'Form submitted successfully',
          'assertive'
        );
      } catch (error) {
        announce(
          options.errorMessage || 'Form submission failed, please try again',
          'assertive'
        );
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, announce, options.successMessage, options.errorMessage]
  );

  return {
    submitForm,
    isSubmitting,
  };
}
