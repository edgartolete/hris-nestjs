import { DataSource } from 'typeorm';

console.log('# database: ', process.env.MYSQL_DATABASE);
console.log('# root pass: ', process.env.MYSQL_ROOT_PASSWORD);

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'db',
        port: 3306,
        username: 'root',
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
      });
      return dataSource.initialize();
    },
  },
];
