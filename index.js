const express = require('express')
const axios = require('axios')
const Bottleneck = require('bottleneck')
const cors = require('cors')
const app = express()
const AWS = require("aws-sdk")
const s3 = new AWS.S3()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

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
        let outputCompanyResults = companies.concat(companyBatch.data.results);
        const outputCompanies = outputCompanyResults.map(({ properties }) => properties.name);
        // return outputCompanies;
        let filename = "companies.json"

        return await s3.putObject({
            Body: JSON.stringify(outputCompanies),
            Bucket: process.env.BUCKET,
            Key: filename,
        }).promise()
    }
}

app.use(cors())

app.get('/companies.json', async (req, res) => {
    let filename = req.path.slice(1)
    try {
        let s3File = await s3.getObject({
            Bucket: process.env.BUCKET,
            Key: filename,
        }).promise()

        res.set('Content-type', "application/json")
        // const jsonString = await s3File.Body.transformToString()
        const json = JSON.parse(s3File.Body.toString('utf-8'))
        res.send(json).end()
    } catch (error) {
        if (error.code === 'NoSuchKey') {
            console.log(`No such key ${filename}`)
            res.sendStatus(404).end()
        } else {
            console.log(error)
            res.sendStatus(500).end()
        }
    }
})

app.get('/getallcompanies', async (req, res) => {
    try {
        const companies = await getCompanies();
        res.json(companies);
    } catch (error) {
        console.log(error);
    }
})

app.listen(process.env.PORT || 3000)