"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { AdminNoticeProvider } from "../feedback/AdminNotice";
import { SectionNavProvider, SectionStage, sectionHome } from "../header/SectionNav";
import { IonIcon, type IonName } from "../icons/Icon";
import { applyAdminTheme, readStoredAdminTheme } from "../preferences";
import { mountPointerSwipe } from "../motion/pointerSwipe";
import { AdminPreferencesProvider } from "./AdminPreferences";
import { AdminShellContext } from "./AdminShellContext";
import styles from "./AdminShell.module.css";

export const ADMIN_NAV_FOLDED_KEY = "caka.admin.navFolded";
const PHONE_QUERY = "(max-width: 720px)";

export type AdminNavItem = {
  href: string;
  label: string;
  paths?: string[];
};

const navIcons: Record<string, IonName> = {
  "/admin/logs": "albums-outline",
  "/admin/calendar": "calendar-outline",
  "/admin/portfolio": "albums-outline",
  "/admin/inquiries": "mail-outline",
  "/admin/settings": "settings-outline",
};

function activeHref(pathname: string, nav: AdminNavItem[]): string {
  return sectionHome(pathname, nav)?.href ?? "";
}

export function AdminShell({
  brand,
  subtitle = "Admin",
  demo = false,
  demoLabel = "Demo",
  nav,
  publicHref,
  publicLabel = "View site",
  logoutAction,
  logoutLabel = "Log out",
  menuLabel = "Open menu",
  closeLabel = "Close menu",
  children,
}: {
  brand: string;
  subtitle?: string;
  demo?: boolean;
  demoLabel?: string;
  nav: AdminNavItem[];
  publicHref?: string;
  publicLabel?: string;
  logoutAction: () => Promise<void>;
  logoutLabel?: string;
  menuLabel?: string;
  closeLabel?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const current = activeHref(pathname, nav);
  const [folded, setFolded] = useState(false);
  const [phone, setPhone] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    setFolded(document.documentElement.hasAttribute("data-admin-nav-folded"));
    applyAdminTheme(readStoredAdminTheme());
    const query = window.matchMedia(PHONE_QUERY);
    const apply = () => {
      const matches = query.matches;
      setPhone(matches);
      if (!matches) setNavOpen(false);
    };
    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;
    return mountPointerSwipe(node);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen && wasOpen.current) menuRef.current?.focus();
    wasOpen.current = navOpen;
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  function toggleFold() {
    const next = !document.documentElement.hasAttribute("data-admin-nav-folded");
    if (next) document.documentElement.setAttribute("data-admin-nav-folded", "");
    else document.documentElement.removeAttribute("data-admin-nav-folded");
    window.localStorage.setItem(ADMIN_NAV_FOLDED_KEY, next ? "1" : "0");
    setFolded(next);
  }

  function toggleNav() {
    if (window.matchMedia(PHONE_QUERY).matches) setNavOpen((open) => !open);
    else toggleFold();
  }

  function closeNav() {
    if (window.matchMedia(PHONE_QUERY).matches) setNavOpen(false);
  }

  return (
    <Suspense fallback={null}>
    <SectionNavProvider nav={nav}>
    <AdminShellContext.Provider value={{ folded, toggleFold }}>
      <AdminNoticeProvider>
        <AdminPreferencesProvider>
          <div ref={shellRef} className={styles.shell} data-folded={folded || undefined} data-nav-open={navOpen || undefined}>
            <button type="button" className={styles.backdrop} aria-label={closeLabel} tabIndex={navOpen ? 0 : -1} onClick={() => setNavOpen(false)} />
            <aside id="admin-sidebar" className={styles.sidebar} inert={phone && !navOpen ? true : undefined}>
              <div className={styles.brandRow}>
                <Link href={nav[0]?.href ?? "/admin"} className={styles.brand} aria-label={brand} onClick={closeNav}>
                  <span className={styles.brandName}>{brand}</span>
                  <span className={styles.brandSubRow}>
                    <span className={styles.brandSub}>{subtitle}</span>
                    {demo ? (
                      <span className={styles.demoTag} title="Database is not connected. Changes are not saved.">
                        {demoLabel}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <button
                  type="button"
                  className={styles.fold}
                  aria-expanded={!folded}
                  aria-controls="admin-sidebar"
                  aria-label={folded ? menuLabel : "Fold menu"}
                  onClick={toggleFold}
                >
                  <IonIcon name={folded ? "chevron-forward-outline" : "chevron-back-outline"} />
                </button>
              </div>

              <nav className={`${styles.nav} adminStagger`} aria-label="Admin">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} adminRise`}
                    data-active={item.href === current || undefined}
                    aria-label={item.label}
                    onClick={closeNav}
                  >
                    {navIcons[item.href] ? <IonIcon name={navIcons[item.href]} /> : null}
                    <span className={styles.label}>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className={styles.sidebarFooter}>
                {publicHref ? (
                  <Link href={publicHref} className={styles.navLink} onClick={closeNav}>
                    <IonIcon name="open-outline" />
                    <span className={styles.label}>{publicLabel}</span>
                  </Link>
                ) : null}
                <form action={logoutAction} className={styles.logoutForm}>
                  <button type="submit" className={styles.logout}>
                    <IonIcon name="log-out-outline" />
                    <span className={styles.label}>{logoutLabel}</span>
                  </button>
                </form>
              </div>
            </aside>

            <div className={styles.main}>
              <div className={`${styles.content} adminRise`} inert={phone && navOpen ? true : undefined}>
                <SectionStage>{children}</SectionStage>
              </div>
              <div className={styles.viewportFade} aria-hidden="true" />
            </div>
            <button
              ref={menuRef}
              type="button"
              className={styles.menuButton}
              aria-expanded={navOpen}
              aria-controls="admin-sidebar"
              aria-label={navOpen ? closeLabel : menuLabel}
              onClick={toggleNav}
            >
              <IonIcon name={navOpen ? "close-outline" : "menu-outline"} />
            </button>
          </div>
        </AdminPreferencesProvider>
      </AdminNoticeProvider>
    </AdminShellContext.Provider>
    </SectionNavProvider>
    </Suspense>
  );
}
