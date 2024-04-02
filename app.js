const express = require('express')
const engine = require('express-handlebars').engine
const Client = require('pg').Client
const Pool = require('pg').Pool
require('dotenv').config()

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PWD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

const app = express()
const port = process.env.PORT || 3000

app.use(express.static('public'))
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', 'views');

app.get('/', (req, res) => {
    res.render('main', {layout : 'index'});
})

app.get('/geojson/:type', async (req, res) => {
    let type = req.params['type']
    let geojson = {
        type: "FeatureCollection",
        features: []
    }
    try {
        let result;
        if (type === "buildings") {
            result = await pool.query("SELECT json_build_object('type','Feature','id',id,'geometry',ST_AsGeoJSON(geom)::json,'properties',json_build_object('plate_id', plate_id,'type', type, 'monument_name', monument_name, 'era', era, 'description', description, 'donor', donor, 'image', image, 'dsm_height', dsm_height, 'delta_height', delta_height)) FROM \"public\".\"primary_buildings_final\";")
        } else if (type === "poi") {
            result = await pool.query("SELECT json_build_object('type','Feature','id',id,'geometry',ST_AsGeoJSON(geom)::json,'properties',json_build_object('plate_id', plate_id, 'poi_id', poi_id, 'description', description, 'image', photo, 'dsm_height', dsm_height)) FROM \"public\".\"poi_final\";")
        } 
        if (result) {
            result.rows.forEach((row,i) => {
                geojson.features.push(row.json_build_object)
            })
        }
    } catch (error) {
        console.error(error);
    } finally {
        res.json(geojson)
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})