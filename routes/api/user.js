const express = require("express");
const router = express.Router();
const gravatar = require('gravatar') // user icon
const User = require("../../modals/User"); //To get data from Modals and be of help with Req.body
const bcrypt = require('bcryptjs'); //  Encrypting Password
const jwt = require('jsonwebtoken');
const config = require('config')

const { check, validationResult } = require("express-validator");

// @route  POST api/users
// @desc   Test Route
// @access Public - Doest need a token , Public access
router.post(
  "/",
  [
    // Express Validator in action
    check("name", "Name is Required").not().isEmpty(),
    check("email", "Please enter a valid email").not().isEmpty(),
    check(
      "password",
      "Please enter a password of 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // See if the user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          errors: [
            {
              msg: "User Already Exists",
            },
          ],
        });
      }

      // Get Users gravatar
      
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      // This Does Not Save The User , just creates an Instance , we need to call user.save to do that.
      user = new User({ 
        name,
        email,
        avatar,
        password  // Password is not encryted yet , it will be done in the step below.
      });

 // Encrypt Password - bcrptyjs     

      // Rounds - parameter that gensalt takes - the more you have the more secure it is but more slower too.
      const salt = await bcrypt.genSalt(10); 

      // The hashed password is stored into user.password Secured
      user.password = await bcrypt.hash(password, salt); 

      // Saves the user to database with encrypted password.
      await user.save();


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
