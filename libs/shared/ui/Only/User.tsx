"use client";
import { type cnst, st } from "@libs/shared/client";

interface UserProps {
  children?: React.ReactNode | React.ReactNode[];
  roles?: cnst.UserRole["value"][];
}
export const User = ({ children, roles }: UserProps) => {
  const storeUse = st.use as unknown as { [key: string]: () => unknown };
  const self = storeUse.self() as cnst.User;
  if (!self.id) return null;
  if (roles?.every((role) => !self.roles.includes(role))) return null;
  return <>{children}</>;
};
