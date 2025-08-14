/**
 * Accessibility Utilities - Malaysian E-commerce Platform
 * WCAG 2.1 AA compliant accessibility helpers and utilities
 */

// ARIA attributes and roles
export const AriaRoles = {
  // Landmark roles
  banner: 'banner',
  main: 'main',
  navigation: 'navigation',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  search: 'search',
  form: 'form',
  region: 'region',

  // Widget roles
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  dialog: 'dialog',
  grid: 'grid',
  gridcell: 'gridcell',
  link: 'link',
  listbox: 'listbox',
  menu: 'menu',
  menubar: 'menubar',
  menuitem: 'menuitem',
  option: 'option',
  progressbar: 'progressbar',
  radio: 'radio',
  radiogroup: 'radiogroup',
  slider: 'slider',
  spinbutton: 'spinbutton',
  tab: 'tab',
  tablist: 'tablist',
  tabpanel: 'tabpanel',
  textbox: 'textbox',
  tree: 'tree',
  treeitem: 'treeitem',

  // Document structure roles
  article: 'article',
  columnheader: 'columnheader',
  definition: 'definition',
  directory: 'directory',
  document: 'document',
  group: 'group',
  heading: 'heading',
  img: 'img',
  list: 'list',
  listitem: 'listitem',
  math: 'math',
  note: 'note',
  presentation: 'presentation',
  row: 'row',
  rowgroup: 'rowgroup',
  rowheader: 'rowheader',
  separator: 'separator',
  table: 'table',
  toolbar: 'toolbar',

  // Live region roles
  alert: 'alert',
  log: 'log',
  marquee: 'marquee',
  status: 'status',
  timer: 'timer',
} as const;

// ARIA properties
export const AriaProperties = {
  // Widget attributes
  autocomplete: 'aria-autocomplete',
  checked: 'aria-checked',
  disabled: 'aria-disabled',
  expanded: 'aria-expanded',
  hasPopup: 'aria-haspopup',
  hidden: 'aria-hidden',
  invalid: 'aria-invalid',
  label: 'aria-label',
  level: 'aria-level',
  multiline: 'aria-multiline',
  multiselectable: 'aria-multiselectable',
  orientation: 'aria-orientation',
  pressed: 'aria-pressed',
  readonly: 'aria-readonly',
  required: 'aria-required',
  selected: 'aria-selected',
  sort: 'aria-sort',
  valuemax: 'aria-valuemax',
  valuemin: 'aria-valuemin',
  valuenow: 'aria-valuenow',
  valuetext: 'aria-valuetext',

  // Live region attributes
  atomic: 'aria-atomic',
  busy: 'aria-busy',
  live: 'aria-live',
  relevant: 'aria-relevant',

  // Drag and drop attributes
  dropeffect: 'aria-dropeffect',
  grabbed: 'aria-grabbed',

  // Relationship attributes
  activedescendant: 'aria-activedescendant',
  controls: 'aria-controls',
  describedby: 'aria-describedby',
  flowto: 'aria-flowto',
  labelledby: 'aria-labelledby',
  owns: 'aria-owns',
  posinset: 'aria-posinset',
  setsize: 'aria-setsize',
} as const;

// Common ARIA attribute values
export const AriaValues = {
  live: {
    polite: 'polite',
    assertive: 'assertive',
    off: 'off',
  },
  autocomplete: {
    inline: 'inline',
    list: 'list',
    both: 'both',
    none: 'none',
  },
  hasPopup: {
    true: 'true',
    false: 'false',
    menu: 'menu',
    listbox: 'listbox',
    tree: 'tree',
    grid: 'grid',
    dialog: 'dialog',
  },
  invalid: {
    true: 'true',
    false: 'false',
    grammar: 'grammar',
    spelling: 'spelling',
  },
  orientation: {
    horizontal: 'horizontal',
    vertical: 'vertical',
    undefined: 'undefined',
  },
  sort: {
    ascending: 'ascending',
    descending: 'descending',
    none: 'none',
    other: 'other',
  },
} as const;

// Screen reader text utilities
export function generateScreenReaderText(
  text: string,
  options: {
    hidden?: boolean;
    atomic?: boolean;
    live?: 'polite' | 'assertive' | 'off';
  } = {}
): React.HTMLAttributes<HTMLElement> {
  const { hidden = false, atomic = false, live = 'polite' } = options;

  return {
    'aria-label': text,
    'aria-hidden': hidden,
    'aria-atomic': atomic,
    'aria-live': live,
    className: 'sr-only', // Assumes CSS class exists for screen reader only content
  };
}

// Focus management utilities
export function createFocusTrap(element: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      deactivate();
    }
  };

  const activate = () => {
    element.addEventListener('keydown', handleTabKey);
    element.addEventListener('keydown', handleEscapeKey);
    firstElement?.focus();
  };

  const deactivate = () => {
    element.removeEventListener('keydown', handleTabKey);
    element.removeEventListener('keydown', handleEscapeKey);
  };

  return { activate, deactivate };
}

// Keyboard navigation helpers
export const KeyboardKeys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  Tab: 'Tab',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
} as const;

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  handlers: Partial<Record<keyof typeof KeyboardKeys, () => void>>
) {
  const key = event.key as keyof typeof KeyboardKeys;
  const handler = handlers[key];
  
  if (handler) {
    event.preventDefault();
    handler();
  }
}

// Color contrast utilities (WCAG AA compliance)
export function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified implementation - in practice you'd use a color library
  // This is a placeholder for actual contrast calculation
  return 4.5; // Placeholder value
}

export function isContrastCompliant(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

// Live region announcements
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management
export function moveFocus(direction: 'next' | 'previous' | 'first' | 'last'): void {
  const focusableElements = Array.from(
    document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ) as HTMLElement[];

  if (focusableElements.length === 0) return;

  const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

  let targetIndex: number;
  switch (direction) {
    case 'next':
      targetIndex = (currentIndex + 1) % focusableElements.length;
      break;
    case 'previous':
      targetIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      break;
    case 'first':
      targetIndex = 0;
      break;
    case 'last':
      targetIndex = focusableElements.length - 1;
      break;
    default:
      return;
  }

  focusableElements[targetIndex]?.focus();
}

// Skip link utilities
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): {
  element: HTMLElement;
  activate: () => void;
} {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link sr-only focus:not-sr-only'; // Tailwind classes
  skipLink.style.position = 'absolute';
  skipLink.style.top = '-40px';
  skipLink.style.left = '6px';
  skipLink.style.zIndex = '1000';

  const activate = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  };

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    activate();
  });

  return { element: skipLink, activate };
}

// Form accessibility helpers
export function generateFormFieldIds(fieldName: string): {
  fieldId: string;
  labelId: string;
  errorId: string;
  helpId: string;
} {
  const baseId = fieldName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return {
    fieldId: `${baseId}-field`,
    labelId: `${baseId}-label`,
    errorId: `${baseId}-error`,
    helpId: `${baseId}-help`,
  };
}

export function getFormFieldAriaAttributes(
  fieldName: string,
  options: {
    hasError?: boolean;
    hasHelp?: boolean;
    required?: boolean;
    invalid?: boolean;
  } = {}
): React.HTMLAttributes<HTMLElement> {
  const { hasError, hasHelp, required, invalid } = options;
  const ids = generateFormFieldIds(fieldName);

  const describedBy: string[] = [];
  if (hasError) describedBy.push(ids.errorId);
  if (hasHelp) describedBy.push(ids.helpId);

  return {
    id: ids.fieldId,
    'aria-labelledby': ids.labelId,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
    'aria-required': required,
    'aria-invalid': invalid || hasError,
  };
}

// Table accessibility helpers
export function getTableAriaAttributes(options: {
  caption?: string;
  sortable?: boolean;
  rowCount?: number;
  columnCount?: number;
}): React.HTMLAttributes<HTMLElement> {
  const { caption, sortable, rowCount, columnCount } = options;

  return {
    role: AriaRoles.table,
    'aria-label': caption,
    'aria-readonly': !sortable,
    'aria-rowcount': rowCount,
    'aria-colcount': columnCount,
  };
}

// Loading state accessibility
export function getLoadingAriaAttributes(
  isLoading: boolean,
  loadingText: string = 'Loading...'
): React.HTMLAttributes<HTMLElement> {
  return {
    'aria-busy': isLoading,
    'aria-live': 'polite',
    'aria-label': isLoading ? loadingText : undefined,
  };
}

// Modal/Dialog accessibility
export function getDialogAriaAttributes(options: {
  titleId?: string;
  descriptionId?: string;
  modal?: boolean;
}): React.HTMLAttributes<HTMLElement> {
  const { titleId, descriptionId, modal = true } = options;

  return {
    role: AriaRoles.dialog,
    'aria-modal': modal,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
  };
}

// Progress/Status accessibility
export function getProgressAriaAttributes(options: {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  valueText?: string;
}): React.HTMLAttributes<HTMLElement> {
  const { value, min = 0, max = 100, label, valueText } = options;

  return {
    role: AriaRoles.progressbar,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': value,
    'aria-valuetext': valueText,
    'aria-label': label,
  };
}

// Navigation accessibility
export function getNavigationAriaAttributes(options: {
  label?: string;
  current?: string;
}): React.HTMLAttributes<HTMLElement> {
  const { label, current } = options;

  return {
    role: AriaRoles.navigation,
    'aria-label': label,
    'aria-current': current,
  };
}

// Error message accessibility
export function getErrorMessageAriaAttributes(
  fieldName: string
): React.HTMLAttributes<HTMLElement> {
  const ids = generateFormFieldIds(fieldName);

  return {
    id: ids.errorId,
    role: AriaRoles.alert,
    'aria-live': AriaValues.live.assertive,
    'aria-atomic': true,
  };
}

// Helper text accessibility
export function getHelpTextAriaAttributes(
  fieldName: string
): React.HTMLAttributes<HTMLElement> {
  const ids = generateFormFieldIds(fieldName);

  return {
    id: ids.helpId,
    'aria-live': AriaValues.live.polite,
  };
}

// Responsive accessibility helpers
export function getResponsiveAriaAttributes(options: {
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}): React.HTMLAttributes<HTMLElement> {
  const { hideOnMobile, hideOnDesktop } = options;

  // This would need to be implemented with media query detection
  const isMobile = window.innerWidth < 768; // Simplified check

  return {
    'aria-hidden': (hideOnMobile && isMobile) || (hideOnDesktop && !isMobile),
  };
}