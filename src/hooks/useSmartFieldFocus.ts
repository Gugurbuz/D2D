import { useEffect, useRef, useState } from 'react';

export interface SmartFocusConfig {
  enabled: boolean;
  autoScroll: boolean;
  highlightDuration: number;
}

export const useSmartFieldFocus = (
  fieldId: string,
  shouldFocus: boolean,
  config: Partial<SmartFocusConfig> = {}
) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const defaultConfig: SmartFocusConfig = {
    enabled: true,
    autoScroll: true,
    highlightDuration: 3000,
    ...config,
  };

  useEffect(() => {
    if (!defaultConfig.enabled || !shouldFocus) {
      setIsHighlighted(false);
      return;
    }

    setIsHighlighted(true);

    if (elementRef.current && defaultConfig.autoScroll) {
      elementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      const focusableElement = elementRef.current.querySelector<HTMLElement>(
        'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElement && focusableElement !== document.activeElement) {
        setTimeout(() => {
          focusableElement.focus();
        }, 500);
      }
    }

    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, defaultConfig.highlightDuration);

    return () => clearTimeout(timer);
  }, [shouldFocus, defaultConfig.enabled, defaultConfig.autoScroll, defaultConfig.highlightDuration]);

  return {
    elementRef,
    isHighlighted,
    setElementRef: (el: HTMLElement | null) => {
      elementRef.current = el;
    },
  };
};

export const useFieldSequence = (fields: string[]) => {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  const markFieldComplete = (fieldId: string) => {
    setCompletedFields((prev) => new Set([...prev, fieldId]));

    const currentIndex = fields.indexOf(fieldId);
    if (currentIndex !== -1 && currentIndex === currentFieldIndex) {
      setCurrentFieldIndex((prev) => Math.min(prev + 1, fields.length - 1));
    }
  };

  const markFieldIncomplete = (fieldId: string) => {
    setCompletedFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fieldId);
      return newSet;
    });
  };

  const getCurrentField = () => fields[currentFieldIndex];

  const isFieldActive = (fieldId: string) => {
    return fields[currentFieldIndex] === fieldId;
  };

  const isFieldComplete = (fieldId: string) => {
    return completedFields.has(fieldId);
  };

  const goToField = (fieldId: string) => {
    const index = fields.indexOf(fieldId);
    if (index !== -1) {
      setCurrentFieldIndex(index);
    }
  };

  const reset = () => {
    setCurrentFieldIndex(0);
    setCompletedFields(new Set());
  };

  return {
    currentField: getCurrentField(),
    currentFieldIndex,
    completedFields,
    isFieldActive,
    isFieldComplete,
    markFieldComplete,
    markFieldIncomplete,
    goToField,
    reset,
    progress: {
      completed: completedFields.size,
      total: fields.length,
      percentage: Math.round((completedFields.size / fields.length) * 100),
    },
  };
};
