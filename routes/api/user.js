const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const router = express.Router();
const keys = require('./../../config/keys');
const validateRegisterInput = require('./../../validation/register')
const validateLoginInput = require('./../../validation/login')

//Load user model

const User = require('./../../models/User');

router.get('/test',(req, res) => {
    res.json({"msg":"User Works!!"});
});



router.post('/register' , (req , res)=>{
    const {errors , isValid}= validateRegisterInput(req.body);
    if(!isValid){
        return res.status(400).json(errors)
    } 
    User.findOne({email : req.body.email})
        .then(user =>{
            if(user){
                return res.status(400).json({email:"already exist"})
            } else{
                const avatar = gravatar.url(req.body.email , {
                    s:'200',//size
                    r: 'pg',//rating
                    d: 'mm'//default
                })
                const newUser= new User({
                    email: req.body.email,
                    name:  req.body.name,
                    avatar,
                    password : req.body.password
                })
                bcrypt.genSalt(10 , (err , salt)=>{
                    bcrypt.hash(newUser.password , salt ,(err , hash)=>{
                        if(err){
                            throw err;
                        }else{
                            newUser.password=hash;
                            newUser.save()
                                .then(user=>{
                                    res.status(200).json(user);
                                })
                                .catch(err =>{
                                    res.status(400).json(err);
                                })
                        }
                        
                    })
                })
            }
        })
});


//Login User return JWT

router.post('/login', (req, res) =>{
    const { errors, isValid } = validateLoginInput(req.body)
    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const email= req.body.email;
    const password = req.body.password;
    //finding the user
    User.findOne({email}) //if found it will return the user object
        .then(user =>{
            if(!user){
                res.status(404).json({email:'user not found!!'})
            }else{
                bcrypt.compare(password, user.password) //it will return a true or false based on result
                    .then(Ismatch =>{
                        if(Ismatch){
                            //res.json({msg:"sucess"})

                            //Jwt takes a payload will conatin user details to decode about user on server , also need to set expiration key
                            const payload ={
                                id:user.id,
                                name:user.name,
                                avatar: user.avatar
                            }
                            //Sign Token
                            jwt.sign(
                                payload ,
                                keys.secretOrKey , 
                                {expiresIn:3000} ,
                                (err , token)=>{
                                    res.status(200).json({
                                        success :"Success" ,
                                        token: 'Bearer '+token
                                    })
                            });
                        }else{
                            return res.status(400).json({password:"incorrect"})
                        }
                    })
            }
        })
});


//A Private route which will return current user after login

router.get('/current' , passport.authenticate('jwt' ,{session:false}) , (req,res)=>{
    // res.json({msg:'sucess'})
    res.status(200).json({
        id:req.user.id,
        name: req.user.name,
        email: req.user.email
    }) 
})

module.exports= router;