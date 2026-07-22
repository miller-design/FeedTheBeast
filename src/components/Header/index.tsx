import styles from './styles.module.css'

const Header = () => {
  return (
    <header className={styles.container}>
      <div className={styles.content}>
        <div>
          <h1 className={styles.typeLogo}>FeedTheBeast</h1>
        </div>
      </div>
    </header>
  )
}

export default Header
