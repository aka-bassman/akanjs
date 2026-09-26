import { LegacyModal } from "./LegacyModal";
import { Modal } from "./Modal";
import { Action, Content, Provider, type ProviderProps, Title, Trigger } from "./Provider";

export const Dialog = ({ children, ...props }: ProviderProps) => {
  return <Provider {...props}>{children}</Provider>;
};
Dialog.Modal = Modal;
Dialog.LegacyModal = LegacyModal;
Dialog.Title = Title;
Dialog.Action = Action;
Dialog.Trigger = Trigger;
Dialog.Content = Content;
