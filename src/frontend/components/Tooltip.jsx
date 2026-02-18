import { createContext, useContext, useState, useCallback } from 'react';

const TooltipContext = createContext(null);

export function TooltipProvider({ children }) {
  const [content, setContent] = useState('');
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [visible, setVisible] = useState(false);

  const show = useCallback((text, anchorRect) => {
    if (!text) return;
    setContent(text);
    setPosition({ left: anchorRect.left, top: anchorRect.top - 8 });
    setVisible(true);
    requestAnimationFrame(() => {
      const gap = 8;
      const el = document.getElementById('tooltip-root');
      if (!el) return;
      const ttRect = el.getBoundingClientRect();
      let top = anchorRect.top - ttRect.height - gap;
      let left = anchorRect.left + anchorRect.width / 2 - ttRect.width / 2;
      if (top < 12) top = anchorRect.bottom + gap;
      left = Math.max(12, Math.min(left, document.documentElement.clientWidth - ttRect.width - 12));
      top = Math.max(12, Math.min(top, document.documentElement.clientHeight - ttRect.height - 12));
      setPosition({ left, top });
    });
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <TooltipContext.Provider value={{ show, hide }}>
      {children}
      <div
        id="tooltip-root"
        role="tooltip"
        className={`fixed z-[9999] px-2 py-1.5 text-sm text-white bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)] rounded pointer-events-none transition-opacity ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ left: position.left, top: position.top }}
      >
        {content}
      </div>
    </TooltipContext.Provider>
  );
}

export function useTooltip() {
  const ctx = useContext(TooltipContext);
  return ctx;
}

export function TooltipAnchor({ text, children, as: Component = 'span', ...rest }) {
  const { show, hide } = useTooltip();

  return (
    <Component
      {...rest}
      onMouseEnter={(e) => show(text, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={hide}
    >
      {children}
    </Component>
  );
}
