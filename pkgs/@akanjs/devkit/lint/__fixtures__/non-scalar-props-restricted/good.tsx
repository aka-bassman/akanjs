export const LoaderIsAllowed = () => <Zone loader={() => fetchThing()} />; // @ok
export const OfIsAllowed = () => <Load of={() => fetchThing()} />; // @ok
export const ScalarProps = () => <Button label="Save" count={3} disabled />; // @ok
export const IdentifierProp = () => <Button onClick={handleSave} />; // @ok
