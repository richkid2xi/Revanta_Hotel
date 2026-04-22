import styles from './LandingPage.module.css';

function LandingPage() {
  return (
    <div className={styles.page}>
      <span className="material-icons-round" style={{ fontSize: 56, color: 'var(--color-primary)' }}>
        public
      </span>
      <h1 className={styles.title}>Volta Region</h1>
      <p className={styles.subtitle}>Guest &amp; Customer Review System</p>
      <p className={styles.placeholder}>
        <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: 6 }}>
          construction
        </span>
        Landing page — awaiting design
      </p>
    </div>
  );
}

export default LandingPage;
