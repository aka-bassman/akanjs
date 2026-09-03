export const D = () => <Field.Text onChange={st.do.setNameOnTask} />; // @ok
export const E = () => <Field.Text onChange={(v) => st.do.setNameOnTask(formatPhone(v))} />; // @ok
export const F = () => <Field.Text onChange={(v) => { st.do.setNameOnTask(v); track(v); }} />; // @ok
export const G = () => <Field.Text onChange={(v) => st.do.writeOnTask("rows.3.name", v)} />; // @ok
export const H = () => <Field.Text onChange={(a, b) => st.do.setNameOnTask(a)} />; // @ok
