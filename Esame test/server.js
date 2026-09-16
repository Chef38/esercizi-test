require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Connessione al database stabilita con successo.');

        await sequelize.sync();

        app.listen(PORT, () => {
            console.log(`Server in ascolto sulla porta ${PORT}`);
        });
    } catch (error) {
        console.error('Impossibile connettersi al database:', error);
        process.exit(1);
    }
}

startServer();