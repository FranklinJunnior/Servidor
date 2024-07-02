const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { DynamoDBClient, PutItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Configuración de AWS SDK
const client = new DynamoDBClient({
    region: 'sa-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Middleware para CORS y parseo de JSON
const corsOptions = {
    origin: '*', // Permitir peticiones desde cualquier origen
    methods: ['GET', 'POST'], // Permitir métodos GET y POST
    allowedHeaders: ['Content-Type', 'Authorization'] // Permitir encabezados específicos
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Middleware para manejar OPTIONS
app.options('*', cors(corsOptions));

// Ruta inicial para mostrar un mensaje en el navegador
app.get('/', (req, res) => {
    res.send('<h1>Servidor de Ladrilleria en funcionamiento</h1>');
});

// Ruta para guardar pedidos en DynamoDB
app.post('/api/pedidos', async (req, res) => {
    const pedido = req.body;

    // Asegúrate de incluir un campo de clave de partición (id en este ejemplo)
    if (!pedido.id) {
        pedido.id = uuidv4();  // Genera un id único si no está presente
    }

    const params = {
        TableName: 'ladrilleria',  // Nombre de tu tabla en DynamoDB
        Item: marshall(pedido)
    };

    try {
        await client.send(new PutItemCommand(params));
        res.status(201).send(pedido);
    } catch (error) {
        console.error('Error al guardar el pedido en DynamoDB:', error);
        res.status(400).send({ error: error.message });
    }
});

// Ruta para guardar contactos en DynamoDB
app.post('/api/contactos', async (req, res) => {
    const contacto = req.body;

    // Asegúrate de incluir un campo de clave de partición (id en este ejemplo)
    if (!contacto.id) {
        contacto.id = uuidv4();  // Genera un id único si no está presente
    }

    const params = {
        TableName: 'ladrilleria',  // Nombre de tu tabla en DynamoDB
        Item: marshall(contacto)   // Utiliza marshall para transformar el objeto a formato DynamoDB
    };

    try {
        await client.send(new PutItemCommand(params));
        console.log('Contacto guardado correctamente:', contacto);
        res.status(201).send(contacto);
    } catch (error) {
        console.error('Error al guardar el contacto en DynamoDB:', error);
        res.status(400).send({ error: error.message });
    }
});

// Ruta para listar todos los contactos en DynamoDB
app.get('/api/contactos', async (req, res) => {
    const params = {
        TableName: 'ladrilleria'
    };

    try {
        const data = await client.send(new ScanCommand(params));
        const contactos = data.Items.map(item => unmarshall(item));
        res.status(200).send(contactos);
    } catch (error) {
        console.error('Error al listar los contactos en DynamoDB:', error);
        res.status(400).send({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});