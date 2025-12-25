/**
 * @fileoverview Layout Components Barrel Export
 * @module components/layouts
 *
 * Layout wrapper components for different sections of the application.
 */

export { default as AdminLayout } from "./AdminLayout";
export { default as PortalLayout, USER_TYPE_CONFIG } from "./PortalLayout";
export type { UserType, UserInfo } from "./PortalLayout";
export { default as WholesaleLayout } from "./WholesaleLayout";
