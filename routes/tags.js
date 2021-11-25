const express = require("express");
const router = express.Router();
var fetchuser = require("../middleware/fetchuser");
const Favourites = require("../models/Favourites");

// ROUTE 1 : add favourite tag : POST "/api/tags/add". Login Required
router.post('/add', fetchuser, async (req, res)=> {
    const {tag} = req.body;
    const userId = req.user.id;
    const entry = await Favourites.findOne({
        user: userId
    });

    if(!entry) {
        const newEntry = new Favourites({
            user: userId,
            tags: [tag]
        }) 
        await newEntry.save();
    } else {
        await Favourites.findOneAndUpdate({
            user: userId,
        }, {
            $push: {
                tags: tag
            }
        })
    }
    res.send({
        msg: "Favourite Tags added"
    })
})

// ROUTE 2 : fetch user's favourite tags : GET "/api/tags/get". Login Required
router.get('/get' ,fetchuser, async (req, res)=> {
    const userId = req.user.id;
    const tags = await Favourites.findOne({
        user: userId
    });
    res.json(tags);
}) 

module.exports=router;