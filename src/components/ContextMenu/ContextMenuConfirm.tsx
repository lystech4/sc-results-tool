import { useEffect, useRef } from "react";
import { Button } from "antd";
import "./ContextMenuConfirm.scss";

type ContextMenuConfirmProps = {
  visible: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  okText?: string;
  cancelText?: string;
  position: { x: number; y: number };
};

export default function ContextMenuConfirm({
  visible,
  title,
  onConfirm,
  onCancel,
  okText = "Oui",
  cancelText = "Non",
  position,
}: ContextMenuConfirmProps) {
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        confirmRef.current &&
        !confirmRef.current.contains(event.target as Node)
      ) {
        onCancel();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onCancel]);

  const getConfirmStyle = () => {
    if (!visible) return { display: "none" };

    const confirmWidth = 250;
    const confirmHeight = 120;

    let adjustedX = position.x;
    let adjustedY = position.y;

    // Ajuster la position pour éviter le débordement
    if (position.x + confirmWidth > window.innerWidth) {
      adjustedX = position.x - confirmWidth;
    }

    if (position.y + confirmHeight > window.innerHeight) {
      adjustedY = position.y - confirmHeight;
    }

    // S'assurer que la boîte reste visible
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    return {
      position: "fixed" as const,
      left: `${adjustedX}px`,
      top: `${adjustedY}px`,
      zIndex: 10000, // Plus élevé que le ContextMenu
    };
  };

  if (!visible) return null;

  return (
    <div
      ref={confirmRef}
      className="context-menu-confirm"
      style={getConfirmStyle()}
    >
      <div className="confirm-content">
        <div className="confirm-title">{title}</div>
        <div className="confirm-buttons">
          <Button size="small" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button size="small" type="primary" danger onClick={onConfirm}>
            {okText}
          </Button>
        </div>
      </div>
    </div>
  );
}
