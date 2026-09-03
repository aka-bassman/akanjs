export const Card = () => <div className="flex" />; // @ok
export const Handler = () => { const onSave = async () => save(); return <button onClick={onSave} />; }; // @ok
export const loadThing = async () => await fetchThing(); // @ok
export function Panel() { return <div className="flex" />; } // @ok
