export default {
  development: {
    client: 'better-sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: '../../example.db'
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb)
      }
    }
  },
  production: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: '../../example.db'
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb)
      }
    }
  }
}
