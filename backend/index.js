const express = require('express')
const fs = require('fs')

const app = express()

app.get('/videos/:filename', (req, res) => {})

app.listen(3000, () => {
    console.log('server is listening')
})