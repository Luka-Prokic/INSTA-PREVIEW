"use client";

import { ChoiceGroup } from "../controls/ChoiceGroup";
import { ADMIN_TABLE_ROW_SIZE_OPTIONS } from "../preferences";
import { useAdminPreferences } from "./AdminPreferences";
import styles from "./AdminShell.module.css";

export function AdminTableRowSizeControl() {
  const { tableDensity, setTableDensity } = useAdminPreferences();

  return (
    <div className={styles.rowSize}>
      <ChoiceGroup
        ariaLabel="Row density"
        value={tableDensity}
        onChange={(value) => setTableDensity(value as typeof tableDensity)}
        options={ADMIN_TABLE_ROW_SIZE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.shortLabel,
          ariaLabel: option.ariaLabel,
        }))}
      />
    </div>
  );
}
