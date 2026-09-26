import { Menu, Menus, Panel, Provider, type ProviderProps } from "./Provider";

export const Tab = (props: ProviderProps) => {
  return <Provider {...props} />;
};
Tab.Menu = Menu;
Tab.Menus = Menus;
Tab.Panel = Panel;
