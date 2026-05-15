import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getHotelSettings } from '../store/reviewsStore';
import styles from './AdminLayout.module.css';

const NAV_ITEMS = [
  { to: '/admin/overview',  icon: 'grid_view',   label: 'Overview'  },
  { to: '/admin/reviews',   icon: 'rate_review', label: 'Reviews'   },
  { to: '/admin/resolved',  icon: 'task_alt',    label: 'Resolved'  },
  { to: '/admin/settings',  icon: 'settings',    label: 'Settings'  },
];

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hotelName, setHotelName] = useState(() => getHotelSettings().name);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('revanta_auth_token');
    if (!token) navigate('/signin', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const handleSettingsUpdate = () => setHotelName(getHotelSettings().name);
    window.addEventListener('revanta_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('revanta_settings_updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  function handleSignOut() {
    // Clear all session tokens
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('revanta_')) localStorage.removeItem(key);
    });
    navigate('/signin', { replace: true });
  }

  function handleToggle() {
    // On desktop → collapse / expand
    // On mobile  → open overlay
    if (window.innerWidth <= 900) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  }

  const sidebarClass = [
    styles.sidebar,
    collapsed    ? styles.sidebarCollapsed : '',
    mobileOpen   ? styles.sidebarMobileOpen : '',
  ].filter(Boolean).join(' ');

  const contentClass = [
    styles.contentArea,
    collapsed ? styles.contentAreaCollapsed : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.shell}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={sidebarClass}>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <span className="material-icons-round" style={{ fontSize: 20, color: '#0D9488' }}>
              hotel
            </span>
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Revanta</span>
              <span className={styles.brandSub}>{hotelName}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="material-icons-outlined">{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={styles.sidebarBottom}>
          <button
            className={styles.bottomItem}
            onClick={toggleTheme}
            title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            <span className="material-icons-outlined">
              {theme === 'dark' ? 'wb_sunny' : 'dark_mode'}
            </span>
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            className={styles.bottomItem}
            onClick={handleSignOut}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <span className="material-icons-outlined">logout</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Content area ─────────────────────────────────── */}
      <div className={contentClass}>

        {/* Top bar */}
        <header className={styles.topbar}>
          {/* Collapse / expand toggle — always visible */}
          <button
            className={styles.collapseBtn}
            onClick={handleToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-icons-round" style={{ fontSize: 20 }}>
              {collapsed ? 'menu_open' : 'menu'}
            </span>
          </button>

          {/* User info */}
          <div 
            className={styles.topbarUser} 
            onClick={(e) => { 
              e.stopPropagation(); 
              setDropdownOpen((o) => !o); 
            }}
          >
            <div className={styles.userAvatar}>
              <span className="material-icons-round" style={{ fontSize: 20, color: '#0D9488' }}>
                account_circle
              </span>
            </div>
            <span className={styles.userName}>{hotelName}</span>
            <span className="material-icons-outlined" style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>
              expand_more
            </span>

            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownName}>{hotelName}</div>
                  <div className={styles.dropdownRole}>Administrator</div>
                </div>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} onClick={() => navigate('/admin/settings')}>
                  <span className="material-icons-outlined">settings</span>
                  Settings
                </button>
                <button className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
                  <span className="material-icons-outlined">{theme === 'dark' ? 'wb_sunny' : 'dark_mode'}</span>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className={styles.dropdownDivider} />
                <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleSignOut}>
                  <span className="material-icons-outlined">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
