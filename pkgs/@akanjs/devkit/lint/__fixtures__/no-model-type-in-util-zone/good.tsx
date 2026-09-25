export interface IdProps { taskId: string; } // @ok
export interface EnumProps { role: cnst.AdminRole["value"]; } // @ok
export interface InitProps { init: ClientInit<cnst.Task>; } // @ok
export interface CallbackProps { onPick: (task: cnst.Task) => void; } // @ok
export interface ModelsWrapperProps { models: ModelsProps<cnst.Task>; } // @ok
export const localAnnotationStaysInFile = (raw: unknown) => raw as cnst.Task; // @ok
