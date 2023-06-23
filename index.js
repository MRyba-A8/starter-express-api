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
                        "propertyName": "packback_campus_id__c",
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
    console.log(companyBatch);
    return companyBatch.results;
}

app.all('/', async (req, res) => {
    try {
        const companies = await getCompanies();
        res.send(companies);
    } catch (error) {
        console.log(error);
    }
    // console.log("Just got a request!")
    // console.log(req.query["page"])
})
app.listen(process.env.PORT || 3000)