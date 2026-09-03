"use client";

export const A = () => { void fetch.initTaskInOrg(orgId); }; // @flag
export const B = () => { void fetch.getTaskInitInOrg(orgId); }; // @flag
