import { type ReactNode, Suspense } from "react";

export interface ClientSideProps {
  children: ReactNode;
  loading?: ReactNode;
}
export const ClientSide = ({ children, loading }: ClientSideProps) => {
  return <Suspense fallback={loading}>{children}</Suspense>;
};
