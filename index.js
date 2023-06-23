const express = require('express')
const app = express()
app.all('/', (req, res) => {
    console.log("Just got a request!")
    console.log(req.params.page)
    res.send("Yo")
})
app.listen(process.env.PORT || 3000)