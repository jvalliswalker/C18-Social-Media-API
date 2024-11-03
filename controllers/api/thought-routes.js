const router = require('express').Router();
const Thought = require('../../models/Thought');
const User = require('../../models/User');
const { awaitWithCatch } = require('../../utils/controllerUtils');
const invalidBodyMessage = 'Invalid user data in request body';

// =====================================================
// Get all endpoint
// =====================================================
router.get('/', async (req, res) => {

  // Get all Thoughts
  const { result, code } = await awaitWithCatch(
    Thought.find().select('-__v')
  );

  // Send result
  res.status(code).json(result);
})

// =====================================================
// Get specific Thought by Id
// =====================================================
router.get('/:thoughtId', async (req, res) => {

  // Query thought
  const { result, code } = await awaitWithCatch(
    Thought.findOne({ _id: req.params.thoughtId })
  );

  // Send result
  res.status(code).json(result);
})

// =====================================================
// Create Thought
// =====================================================
router.post('/', async (req, res) => {

  // Extract data parameters and validate
  const { thoughtText, userId } = req.body;
  
  if(!thoughtText || !userId){
    res.status(400).json(
      { message: invalidBodyMessage }
    );
  }

  // Search for User, return error if not found
  const userQueryResults = await awaitWithCatch(
    User.find({ _id: userId })
  );

  if(userQueryResults.code >= 300 ){
    res.status(userQueryResults.code).json(userQueryResults.result);
  }

  const user = userQueryResults.result[0];

  // Attempt Thought creation
  const { result, code } = await awaitWithCatch(
    Thought.create(
      {
        thoughtText: thoughtText,
        userId: userId,
        username: user.username
      }
  ));

  // Add new thought to User record
  user.thoughts.push(result);
  await user.save();

  // Send result
  res.status(code).json(result);
})

// =====================================================
// Update Thought by Id
// =====================================================
router.put('/:thoughtId', async (req, res) => {

  // Destructure Thought fields and validate
  const { thoughtText, userId } = req.body;

  if(!thoughtText && !userId){
    res.status(500).send(invalidBodyMessage)
  }


  // Query and update Thought
  const { result, code } = await awaitWithCatch(
    Thought.findOneAndUpdate(
      { _id: req.params.thoughtId },
      req.body,
      { new: true }
    )
  )

  // Send result
  res.status(code).json(result);
})

// =====================================================
// Delete Thought by Id
// =====================================================
router.delete('/:thoughtId', async (req, res) => {

  // Delete Thought
  const { result, code } = await awaitWithCatch(
    Thought.findOneAndDelete(
      { _id: req.params.thoughtId }
    )
  )

  // Send result
  res.status(code).json(result);
})

// =====================================================
// Add Reaction to Thought by Id
// =====================================================
router.post('/:thoughtId/reactions', async (req, res) => {

  // Query parent Thought
  const queriedThought = await awaitWithCatch(
    Thought.findOne(
      { _id: req.params.thoughtId }
    )
    .populate('reactions')
  );

  // Send error if query failed
  if (queriedThought.code >= 300){
    res.status(queriedThought.code).json(queriedThought.result);
  }

  const thought = queriedThought.result;

  // Validate POST body
  if(!req.body.reactionBody || !req.body.username){
    res.status(500).json(invalidBodyMessage);
  }

  thought.reactions.push(
    {
      reactionBody: req.body.reactionBody,
      username: req.body.username
    }
  );

  await thought.save();

  // Send result
  res.status(201).send();
})

// =====================================================
// Delete Reaction by Id
// =====================================================
router.delete('/:thoughtId/reactions/:reactionId', async (req, res) => {

  // Query parent Thought
  const queriedThought = await awaitWithCatch(
    Thought.findOne(
      { _id: req.params.thoughtId }
    )
    .populate('reactions')
  );

  // Send error if query failed
  if (queriedThought.code >= 300){
    res.status(code).json(queriedThought.result);
  }

  const thought = queriedThought.result;

  thought.reactions.pull(req.params.reactionId);

  // Send result
  res.status(200).json(thought);
})



module.exports= router;