const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'postgres',
    entities: ['dist/coffees/entities/*.js'], // Updated path
    migrations: ['dist/migrations/*.js'], // Assuming migrations are here after compilation
    cli: {
        migrationsDir: 'src/migrations',
    },
});

module.exports = AppDataSource;
