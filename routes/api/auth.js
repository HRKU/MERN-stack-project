const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth'); // connecting middleware 
const User = require("../../modals/User"); // connecting user modal
const jwt = require('jsonwebtoken');
const config = require('config')
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs'); //  Encrypting Password


// @route  GET api/auth
// @desc   Test Route
// @access Public - Doest need a token , Public access

// Adding auth as another parameter will make it safe an secure / Protected.
router.get("/", auth, async (req, res) => 
{
    try{
        const user = await  User.findById(req.user.id).select('-password');
        res.json(user);
    }
    catch(err)
    {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  POST api/auth
// @desc   auth user & get token 
// @access Public - Doest need a token , Public access
router.post(
    "/",
    [
      // Express Validator in action
      check("email", "Please enter a valid email").not().isEmpty(),
      check(
        "password",
        "Password is required"
      ).exists(),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const {  email, password } = req.body;
  
      try {
        // See if the user exists
        let user = await User.findOne({ email });
  
        if (!user) {
          return res.status(400).json({
            errors: [
              {
                msg: "Invalid Credentials",
              },
            ],
          });
        }
// Keeping the same Response for user exists / password incorrect will help with security.
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({
                errors: [
                  {
                    msg: "Invalid Credentials",
                  },
                ],
              });
        }


        // Return JsonWebToken - To get log'ed in right away.
        
        const payload = {
          user: {
            id: user.id
          }
        };
  
        jwt.sign(
          payload, 
          config.get('jwtsecret'),
          {
            expiresIn: 3600000  
            // the duration for which the jwt token will be valid / good pratice to keep it at 3600(1hr)
          },
          // The part below will get us back the json web token 
            (err, token) =>
            {
              if(err) throw err;
              res.json({ token });
            });
  
  
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
      }
    }
  );
  
module.exports = router;
