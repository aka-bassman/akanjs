export const ArrowProp = () => <Button onClick={() => save()} />; // @flag
export const ArrowWithTwoParams = () => <Button onSelect={(id, kind) => save(id, kind)} />; // @flag
export const ArrowWithBareParam = () => <Button onChange={value => save(value)} />; // @flag
export const FunctionExpressionProp = () => <Button onClick={function () { save(); }} />; // @flag
export const NamedFunctionProp = () => <Button onClick={function handle() { save(); }} />; // @flag
