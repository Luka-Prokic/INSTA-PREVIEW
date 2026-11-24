/** Narrow entry so we don't typecheck unused CAKA-CMS admin modules (calendar, forms, …). */
export { ChoiceGroup } from "../../vendor/admin/src/controls/ChoiceGroup";
export { ConfirmDialog } from "../../vendor/admin/src/feedback/ConfirmDialog";
export { IonIcon } from "../../vendor/admin/src/icons/Icon";
export type { IonName } from "../../vendor/admin/src/icons/Icon";
export { usePointerTilt, motionReduced } from "../../vendor/admin/src/motion/usePointerTilt";
export { mountPointerSwipe } from "../../vendor/admin/src/motion/pointerSwipe";
export {
  ADMIN_THEME_KEY,
  applyAdminTheme,
  readStoredAdminTheme,
} from "../../vendor/admin/src/preferences";
export type { AdminTheme } from "../../vendor/admin/src/preferences";