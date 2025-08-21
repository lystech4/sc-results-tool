// ContextMenuProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import ContextMenu from "../components/ContextMenu/ContextMenu";

interface ContextMenuState {
  isVisible: boolean;
  x: number;
  y: number;
  options: ContextMenuOption[];
  title?: string;
}

interface ContextMenuContextType {
  showContextMenu: (
    x: number,
    y: number,
    options: ContextMenuOption[],
    title?: string
  ) => void;
  hideContextMenu: () => void;
  contextMenuState: ContextMenuState;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  }
  return context;
};

export const useContextMenuHandler = () => {
  const { showContextMenu } = useContextMenu();

  const handleContextMenu = (
    event: React.MouseEvent,
    options: ContextMenuOption[],
    title?: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    showContextMenu(event.clientX, event.clientY, options, title);
  };

  return { handleContextMenu };
};

export default function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isVisible: false,
    x: 0,
    y: 0,
    options: [],
    title: undefined,
  });

  const showContextMenu = (
    x: number,
    y: number,
    options: ContextMenuOption[],
    title?: string
  ) => {
    setContextMenuState({
      isVisible: true,
      x,
      y,
      options,
      title,
    });
  };

  const hideContextMenu = () => {
    setContextMenuState((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <ContextMenuContext.Provider
      value={{ showContextMenu, hideContextMenu, contextMenuState }}
    >
      {<ContextMenu />}
      {children}
    </ContextMenuContext.Provider>
  );
}
