const express = require('express')
const axios = require('axios')
const Bottleneck = require('bottleneck')
const app = express()

const headers = {
    "content-type": "application/json",
    "authorization": `Bearer ${process.env.HS_KEY}`
}

const limiter = new Bottleneck({
    minTime: 333
});

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
    if ("paging" in companyBatch.data) {
        let addedCompanies = companies.concat(companyBatch.data.results);
        const limitedRecursion = limiter.wrap(getCompanies)
        return await limitedRecursion(addedCompanies, companyBatch.data.paging.next.after);
    } else {
        let outputCompanies = companies.concat(companyBatch.data.results);
        return outputCompanies;
    }
}

app.all('/', async (req, res) => {
    try {
        const companies = await getCompanies();
        res.json(companies);
    } catch (error) {
        console.log(error);
    }
    // console.log("Just got a request!")
    // console.log(req.query["page"])
})
app.listen(process.env.PORT || 3000)