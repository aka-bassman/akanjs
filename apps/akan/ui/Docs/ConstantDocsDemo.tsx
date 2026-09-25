"use client";

import "@apps/akan/lib/cnst";

import { Constant } from "akanjs/ui";

//? the docs app declares no database model, so the live demos draw the scalars it and @libs/util register
const scalars = ["docPage", "accessToken", "accessLog", "accessStat", "coordinate"];

export const ConstantDocsDemo = () => <Constant.Doc.Zone scalars={scalars} openAll />;

export const ConstantDocsPrintDemo = () => <Constant.Doc.Print scalars={scalars.slice(0, 3)} />;
