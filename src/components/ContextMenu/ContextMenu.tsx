// ContextMenu.tsx
import React, { useEffect, useRef, useState } from "react";
import "./ContextMenu.scss";
import { useContextMenu } from "../../Contexts/ContextMenuProvider";
import { Button } from "antd";
import ContextMenuConfirm from "./ContextMenuConfirm";

export default function ContextMenu() {
  const { contextMenuState, hideContextMenu } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmState, setConfirmState] = useState<{
    visible: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    option: any;
    position: { x: number; y: number };
  }>({
    visible: false,
    option: null,
    position: { x: 0, y: 0 },
  });
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
        setConfirmState({
          visible: false,
          option: null,
          position: { x: 0, y: 0 },
        });
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (confirmState.visible) {
          setConfirmState({
            visible: false,
            option: null,
            position: { x: 0, y: 0 },
          });
        } else {
          hideContextMenu();
        }
      }
    };

    if (contextMenuState.isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenuState.isVisible, confirmState.visible, hideContextMenu]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConfirmationClick = (option: any, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setConfirmState({
      visible: true,
      option,
      position: {
        x: rect.right + 10, // Décalage à droite du bouton
        y: rect.top,
      },
    });
  };

  const handleConfirmAction = () => {
    if (confirmState.option) {
      confirmState.option.onClick();
      hideContextMenu();
      setConfirmState({
        visible: false,
        option: null,
        position: { x: 0, y: 0 },
      });
    }
  };

  const handleCancelConfirm = () => {
    setConfirmState({ visible: false, option: null, position: { x: 0, y: 0 } });
  };

  // Ajuster la position pour éviter le débordement
  const getMenuStyle = () => {
    if (!contextMenuState.isVisible) return { display: "none" };

    const { x, y } = contextMenuState;
    const menuWidth = 200; // Largeur estimée du menu
    const menuHeight = 300; // Hauteur estimée du menu

    let adjustedX = x;
    let adjustedY = y;

    // Vérifier les limites de l'écran
    if (x + menuWidth > window.innerWidth) {
      adjustedX = x - menuWidth;
    }

    if (y + menuHeight > window.innerHeight) {
      adjustedY = y - menuHeight;
    }

    return {
      position: "fixed" as const,
      left: `${adjustedX}px`,
      top: `${adjustedY}px`,
      zIndex: 9999,
    };
  };

  if (!contextMenuState.isVisible) return null;

  return (
    <div ref={menuRef} className="context-menu" style={getMenuStyle()}>
      {contextMenuState.title && (
        <div className="context-menu-title">{contextMenuState.title}</div>
      )}
      <div className="context-menu-options">
        {contextMenuState.options.map((option, index) => (
          <React.Fragment key={index}>
            {option.separator && <div className="context-menu-separator" />}{" "}
            {option.requestConfirmation ? (
              <Button
                disabled={option.disabled}
                className={`context-menu-option ${option.disabled ? "disabled" : ""
                  }`}
                onClick={(e) => {
                  if (!option.disabled) {
                    handleConfirmationClick(option, e);
                  }
                }}
              >
                <span className="context-menu-label">{option.label}</span>
                {option.icon && (
                  <span className="context-menu-icon">{option.icon}</span>
                )}
              </Button>
            ) : (
              <Button
                disabled={option.disabled}
                className={`context-menu-option ${option.disabled ? "disabled" : ""
                  }`}
                onClick={() => {
                  if (!option.disabled) {
                    option.onClick();
                    hideContextMenu();
                  }
                }}
              >
                <span className="context-menu-label">{option.label}</span>
                {option.icon && (
                  <span className="context-menu-icon">{option.icon}</span>
                )}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      <ContextMenuConfirm
        visible={confirmState.visible}
        title={
          confirmState.option?.confirmationMessage ||
          "Êtes-vous sûr de vouloir faire ça?"
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
        okText={confirmState.option?.yesText || "Oui"}
        cancelText={confirmState.option?.noText || "Non"}
        position={confirmState.position}
      />
    </div>
  );
}
