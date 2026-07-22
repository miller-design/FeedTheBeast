import { Link } from '@tanstack/react-router'
import { FOOTER_COPYRIGHT, FOOTER_LINKS } from '../../lib/const'
import styles from './styles.module.css'

const Footer = () => {
  const year = new Date().getFullYear()
  const currentYear = year.toString()

  return (
    <footer className={styles.container}>
      <div className={styles.content}>
        <div>
          <p className={styles.copyright}>
            &copy; {currentYear} {FOOTER_COPYRIGHT}
          </p>
        </div>
        <nav className={styles.nav}>
          <ul>
            {FOOTER_LINKS.map(
              (link) =>
                link.href && (
                  <li key={link.label}>
                    <Link to={link.href} target={link.target}>
                      {link.label}
                    </Link>
                  </li>
                ),
            )}
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
