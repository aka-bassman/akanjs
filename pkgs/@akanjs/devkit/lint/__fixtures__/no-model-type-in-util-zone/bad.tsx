export interface CardProps { task: cnst.Task; } // @flag
export type RowProps = { banner: cnst.LightBanner }; // @flag
export const View = ({ task }: { task: cnst.Task }) => <div className="flex" />; // @flag
