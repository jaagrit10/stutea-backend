const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
var fetchuser = require("../middleware/fetchuser");
const Questions = require("../models/Questions");
const Credits = require("../models/Credits");
const User = require("../models/User");


// Route 1 : Add a new question : POST "/api/questions/add". Login Required.
router.post(
    "/add",
    fetchuser,
    [
        body("tags", "Cannot be empty").exists(),
        body("question", "Cannot be empty").exists(),
    ],
    async (req, res) => {
        const { question, tags } = req.body;

        // If there are errors, return bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const query = new Questions({
                question,
                tags,
                user: req.user.id,
            });
            const savedNote = await query.save();
            const debitee = req.user.id;
            const debit = await Credits.findOne({"user": debitee});
            if (debit==null)
            {
                const initialiser = new Credits({
                    user : req.user.id,
                    credits : 1000
                })
                const saved  = await initialiser.save();
                const debiti = await Credits.findOne({"user": debitee});
                const item2 = debiti.credits - 50;
                const less = await Credits.findOneAndUpdate({"user": debitee},{
                    $set : {
                        credits: item2
                    }
                })
            }

            else
            {
                const debiti = await Credits.findOne({"user": debitee});
                const item2 = debiti.credits - 50;
                const less = await Credits.findOneAndUpdate({"user": debitee},{
                    $set : {
                        credits: item2
                    }
                })
            }
                res.json(savedNote);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error");
        }
    }
);

// ROUTE 2 : Fetch questions : POST "/api/questions/fetch". Login Required
router.post("/fetch", fetchuser, async (req, res) => {
    try {
        const { page } = req.body;

        const questions = await Questions.find({ user: { $ne: req.user.id }, responded: {$ne: true} }).sort({timestamp:-1})
            .limit(5)
            .skip((page - 1) * 5);

        const count = await Questions.find({
            user: { $ne: req.user.id },
            responded: {$ne: true}
        }).count();

        questions.sort(function (a, b) {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        res.json({ questions, count });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// ROUTE 3 : Fetch user's own questions POST "/api/questions/fetchuser". Login Required
router.post("/fetchuser", fetchuser, async (req, res) => {
    try {
        const { page } = req.body;
        const user = req.user.id;
        const myQuestions = await Questions.find({ user })
            .limit(15)
            .skip((page - 1) * 15);
        const count = await Questions.find({ user }).count();

        myQuestions.sort(function (a, b) {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        res.json({ myQuestions, count });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// ROUTE 4 : Fetch the question by id POST "/api/questions/getquestion". Login Required
router.post(
    "/getquestion",
    fetchuser,
    [body("quesid", "Cannot be empty").exists()],
    async (req, res) => {
        // If there are errors, return bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { quesid } = req.body;
            const question = await Questions.findById(quesid);
            res.json(question);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error");
        }
    }
);

// ROUTE 5 : Delete Question by id DELETE "/api/questions/deleteques". Login Required
router.delete("/deleteques/:id", fetchuser, async (req, res) => {
    try {
        var question = await Questions.findById(req.params.id);
        if (!question) {
            return res.status(400).send("Not Found!");
        }

        if (question.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed!");
        }

        await Questions.findByIdAndDelete(req.params.id);
        res.json("DELETED!");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// ROUTE 6 : Get question by tags  POST "/api/questions/tags/:tag". Login required
router.get(
    "/tags/:tag",
    fetchuser,
    async (req, res) => {
        try {
            const questions = await Questions.find({
                tags: req.params.tag,
            }).limit(15);
            const count = await Questions.find({ tags: req.params.tag, user: { $ne: req.user.id } }).count();

            questions.sort(function (a, b) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            res.json({questions, count});
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error");
        }
    }
);

// ROUTE 7 : Get all the tags GET "/api/questions/alltags"
router.get('/alltags', fetchuser, async(req, res)=> {
    try {
        const tags = await Questions.find({user: { $ne: req.user.id }}).distinct('tags');
        res.json(tags);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

module.exports = router;
