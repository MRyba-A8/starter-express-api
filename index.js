const express = require('express')
const axios = require('axios')
const app = express()

const headers = {
    "content-type": "application/json",
    "authorization": `Bearer ${process.env.HS_KEY}`
}

async function getCompanies(companies = [], after = 0) {
    const searchURL = "https://api.hubapi.com/crm/v3/objects/companies/search";
    const searchBody = {
        "filterGroups": [
            {
                "filters": [
                    {
                        "propertyName": "packback_campus_id",
                        "operator": "HAS_PROPERTY"
                    }
                ]
            }
        ],
        "properties": [
            "name"
        ],
        "limit": 100,
        "after": after
    }
    const companyBatch = await axios.post(searchURL, searchBody, { headers: headers });
    return companyBatch;
}

app.all('/', async (req, res) => {
    res.send(await getCompanies());
    // console.log("Just got a request!")
    // console.log(req.query["page"])
})
app.listen(process.env.PORT || 3000)