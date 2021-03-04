const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const { check, validationResult} = require('express-validator/check');
const Post = require('../../modals/Post');
const Profile = require('../../modals/Profile');
const User = require('../../modals/User');

// @route  POST api/post
// @desc   Create a post 
// @access Private  
router.post(
    '/' ,
    [auth, 
    [
    check('text', 'Text is required').not().isEmpty()
    ]
    ], 
    async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) 
    {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })
        
        const post = await newPost.save();
        
        res.json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
   
});
// @route  GET api/posts
// @desc   GET all posts
// @access Private

router.get('/', auth, async(req, res) => {
    try {
        const posts = await Post.find().sort({ date:-1});
       
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route  GET api/posts/:id
// @desc   GET psot by ID 
// @access Private

router.get('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({ msg:'Post not found'})
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg:'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});
// @route  Delete api/posts
// @desc   Delete all posts
// @access Private
//
router.delete('/:id',auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //check post 
        if(!post){
            return res.status(404).json({ msg:'Post not found'})
        }
        // check user
        if(post.user.toString() !== req.user.id){
            return res.status(401).json({msg:'User not authorized'});
        }
        await post.remove();
        res.json({
            msg:'Post Removed'
        });
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg:'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});
module.exports = router;
// @route  PUT api/posts/like/:id
// @desc   Like a post
// @access Private

router.put('/like/:id', auth, async(req, res) =>{
    try {
        const post = await Post.findById(req.params.id);

        // check if the post has been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length >0){
            return res.json(400).json({msg:'Post already liked'});

        }
        post.likes.unshift({ user: req.user.id});

        await post.save();

        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
}
)