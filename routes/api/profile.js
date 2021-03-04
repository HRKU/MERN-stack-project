const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth') 
const request = require('request');
const config = require('config');
const { check, validationResult } = require("express-validator");

const Profile = require('../../modals/Profile')
const User = require('../../modals/User')


// @route  GET api/profile/me
// @desc   Get Current Users Profile
// @access Private - Needs a Token 
router.get("/me",auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user',['name','avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user'});
        }
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// @route  GET api/profile
// @desc   Create or Update a user profile
// @access Private - Needs a Token
router.post("/", [auth, [
    check('status','Status is required').not().isEmpty(),
    check('skills','Skills is required').not().isEmpty()
    ]
],
 async (req, res) => {
     const errors = validationResult(req);
     if(!errors.isEmpty()) {
         return res.status(400).json({errors: errors.array()});
     }
     // Destruture the Request
     const {
        company,
        location,
        bio,
        status,
        githubusername,
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
      } = req.body;

      // Build Profile Object
      const profileFields = {};

      profileFields.user = req.user.id;
      if(company) profileFields.company = company;
      if(website) profileFields.website = website;
      if(location) profileFields.location = location;
      if(bio) profileFields.bio = bio;
      if(status) profileFields.status = status;
      if(githubusername) profileFields.githubusername = githubusername;
      if(skills) {
          profileFields.skills = skills.split(',').map(skills => skills.trim());

      }
      
      //Build Social Object
      // Init is important or else it will give an error of undefined 
      // Thus init is important i.e making an object of it
      profileFields.social = {};
      if(youtube) profileFields.social.youtube = youtube;
      if(twitter) profileFields.social.twitter = twitter;
      if(facebook) profileFields.social.facebook = facebook;
      if(linkedin) profileFields.social.linkedin = linkedin;
      if(instagram) profileFields.social.instagram = instagram;

      try {
          let profile = await Profile.findOne({ user: req.user.id });

          if(profile) {
              // Update the Profile
              profile = await Profile.findOneAndUpdate(
                { user: req.user.id},
                { $set: profileFields},
                { new: true}
              );

              return res.json(profile);
          }
          
          // Create a Profile

          profile = new Profile(profileFields);

          // Saving the profile. Not "Profile"
          await profile.save();
          res.json(profile);

          
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error')
      }


    } 
 );
 // @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
    try {
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
// @route  GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', async (req,res) => {
    try {  
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name', 'avatar']);
        if(!profile) 
        return res.status(400).json(
            {
                msg: "Profile Not Found."
            }
            );
        res.json(profile);
    }
    catch (err) 
    {
        console.error(err.message);
        if(err.kind == "ObjectId"){
            return res.status(400).json(
                { msg: "Profile Not Found."}
                )}
        res.status(400).send('Server Error');    
    }
});

// @route   DELETE api/profile
// @desc    DELETE profile user and posts
// @access  Private
router.delete('/', auth, async (req,res) => {
    try { 
        // Remove Profile
        await Profile.findOneAndRemove({user: req.user.id});
        // Remove User
        await User.findOneAndRemove({ _id: req.user.id });
       
        res.json({msg: 'User Deleted'});
    }
    catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');    
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', [auth,[
    check('title', 'Title is Required').not().isEmpty(),
    check('company', 'Company is Required').not().isEmpty(),
    check('from', 'From Date is Required').not().isEmpty(),

]], async(req, res) =>
{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({ user: req.user.id});
        //IMPORTANT 'unshift' - Same as Pushing - But the most recent are shown first. 
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
})
// @route   DELETE api/profile/experience/:exp_id
// @desc    DELETE profile experience
// @access  Private
router.delete('/experience/:exp_id', auth, async (req,res) => {
    try { 
        // Find the Correct Profile
        const profile = await Profile.findOne({ user: req.user.id});

        // Get Remove Index - The profile that needs to removed 
        const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);   
        // Remove that required experince 
        profile.experience.splice(removeIndex, 1);
        // Saving / Updating it 
        await profile.save();

        res.json(profile);
    }
    catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');    
    }
});
// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private

router.put('/education', [auth,[
    check('school', 'School is Required').not().isEmpty(),
    check('degree', 'Degree is Required').not().isEmpty(),
    check('fieldofstudy', 'Field is Required').not().isEmpty(),
    check('from', 'From Date is Required').not().isEmpty(),

]], async(req, res) =>
{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;
    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({ user: req.user.id});
        //IMPORTANT 'unshift' - Same as Pushing - But the most recent are shown first. 
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
})

// @route   DELETE api/profile/education/:edu_id
// @desc    DELETE profile education
// @access  Private
router.delete('/education/:edu_id', auth, async (req,res) => {
    try { 
        // Find the Correct Profile
        const profile = await Profile.findOne({ user: req.user.id});

        // Get Remove Index - The profile that needs to removed 
        const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);   
        // Remove that required experince 
        profile.education.splice(removeIndex, 1);
        // Saving / Updating it 
        await profile.save();

        res.json(profile);
    }
    catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');    
    }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from github For the username typed in postman 
// @access  public

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientID')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        };

        request(options, (error, response, body) =>{
            if(error)   console.error(error);

            if(response.statusCode != 200) {
               return res.status(404).json({msg: "No Github Profile Found"});
            }
            res.json(JSON.parse(body)); 
        })


    } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');   
    }
})

module.exports = router;
