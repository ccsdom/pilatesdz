"use client";
import { createContext, useContext } from "react";
import type { CenterRole } from "@/domain/models/access";
const RoleContext = createContext<CenterRole>("manager");
export const CrmRoleProvider = RoleContext.Provider;
export const useCrmRole = () => useContext(RoleContext);
