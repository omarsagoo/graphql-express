// Import dependancies
const express = require('express')
const {graphqlHTTP} = require('express-graphql')
const {buildSchema} = require('graphql')

const fetch = require('node-fetch')

// require dotenv and call cofig
require('dotenv').config()

// Get API key from environment variable

const schema = buildSchema(`
    type Weather {
        temperature: Float
        feels_like: Float
        temp_min: Float
        temp_max: Float
        pressure: Int
        humidity: Int
        description: String
        cod: Int
        message: String
    }

    enum Units {
        standard
        metric
        imperial
    }

    type Query {
        getWeather(zip: Int, units: Units, lat: Float, long: Float): Weather!
    }

    type Pet {
        name: String!
        species: String!
    }

    type Mutation {
        addPet(name: String!, species: String!): Pet!
        updatePet(id: Int!, name: String, species: String): Pet
        deletePet(id: Int!): Pet
        getPet(id: Int!): Pet
    }
`)

const petList = []

const root = {
    getWeather: async ({ zip, units = 'imperial', lat, long }) => {
          const apikey = process.env.OPENWEATHERMAP_API_KEY
          let url = `https://api.openweathermap.org/data/2.5/weather?${zip ? "zip=" + zip : "lat=" + lat +"&lon=" + long }&appid=${apikey}&units=${units}`
          const res = await fetch(url)
          const json = await res.json()

          if (json.message) {
            const cod = json.cod
            const message = json.message

            return {cod, message}
          }
          const temperature = json.main.temp
          const feels_like = json.main.feels_like
          const temp_min = json.main.temp_min
          const temp_max = json.main.temp_max
          const pressure = json.main.pressure
          const humidity = json.main.humidity
          const description = json.weather[0].description

          return {temperature, feels_like, temp_min, temp_max, pressure, humidity, description}
      },
    addPet: ({ name, species }) => {
        const pet = { name, species }
        petList.push(pet)
        return pet
    },
    updatePet: ({ id, name, species }) => {
        const pet = petList[id]  // is there anything at this id? 
        if (pet === undefined) { // Id not return null
            return null 
        }
        // if name or species was not included use the original
        pet.name = name || pet.name 
        pet.species = species || pet.species
        return pet
    },
    deletePet: ({ id }) => {
        const pet = petList.splice(id - 1, 1)
        
        return pet[0]
    },
    getPet: ({ id }) => {
        const pet = petList[id - 1]

        return pet
    }
  }
// Create an express app
const app = express()

// require CORS
const cors = require('cors')

// CORS middleware
app.use(cors())

// Define a route for GraphQL
app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
}))

// Start this app
const port = 4000
app.listen(port, () => {
    console.log('Running on port:' + port)
})