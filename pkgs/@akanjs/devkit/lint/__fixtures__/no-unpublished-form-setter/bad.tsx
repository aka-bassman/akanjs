export const A = () => <Field.Text onChange={(v) => st.do.setNameOnTask(v)} />; // @flag
export const B = () => <Switch onChange={(value) => void st.do.setDoneOnTask(value)} />; // @flag
export const C = () => <Select onChange={(v) => { st.do.setTypeOnTask(v); }} />; // @flag
