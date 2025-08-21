type ContextMenuOption = {
  label: string;
  onClick: () => void;

  icon?: ReactNode;
  disabled?: boolean;
  separator?: boolean;
  requestConfirmation?: boolean;
  confirmationMessage?: string;
  yesText?: string;
  noText?: string;
};
