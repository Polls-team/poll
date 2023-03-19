const bcrypt = require('bcrypt');
const validator = require("email-validator");
const { User, Poll } = require("../models");


const userAuthController = {
  async handleSignUpForm(req,res){
    
    req.session.vote = req.session.vote || [];
    const votes = req.session.vote;   
     
      const polls = await Poll.findAll({
        include: [
          {
            order: ["title"],
            association: "author",
            attributes: ["pseudo"]
          }
        ]
      });

    //on réupere les donnés du signup du form
    const { pseudo, firstname, lastname, email, password, confirmation } = req.body;
  
     
    //1-On vérifie qu'aucun champ est remplis et non vide
    if (!pseudo || !firstname || !lastname || !email || !password || !confirmation) {
      res.render("frontPage", { polls, votes, errorMessage: "Please fill all the fields before submitting" });
      return;
    }

    //2- on vérifie que le password et la confirmation matchent
    if(password !== confirmation) {
      res.render("frontPage", { polls, votes, errorMessage: "Passwords don't match" });
      return;
    }

    //3 on vérifie que le password est plus long que 8 characters
    if(password.length < 8) {
      res.render("frontPage", { polls, votes, errorMessage: "Please enter a password with at least 8 characters" });
      return;
    }

    //4 on vérifie que l'email est "valide grâce à email-validator"
    if (! validator.validate(email) ) {
      res.render("frontPage", { polls, votes, errorMessage: "Please enter a valid email adress" });
      return;
    }
    
    //5 on vérifie que l'email n'est pas déjà pris 
    const alreadyExistingEmail = await User.findOne({ where: { email:email}});
    if (alreadyExistingEmail) {
      res.render("frontPage", { polls, votes, errorMessage: "This email is already taken" });
      return;
    }
    
    //6 on vérifie que le pseuo n'est pas déjà pris 
    const alreadyExistingPseudo = await User.findOne({ where: { pseudo:pseudo}});
    if (alreadyExistingPseudo) {
      res.render("frontPage", { polls, votes, errorMessage: "This pseudo is already taken" });
      return;
    }    

     // ===== INSERTION DU USER ====
    // ON hash le password

    const saltRounds = parseInt(process.env.SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    //2. Insertion dans la bdd

    await User.create({
      pseudo: pseudo,
      firstname: firstname,
      lastname:lastname,
      email:email,
      password: hashedPassword
    }), 
    console.log(req.body)
    res.render("frontPage", { polls, votes,errorMessage: "You are successfully registered. Please authenticate now."});
  },

  async handleLoginForm(req,res){
    
    req.session.vote = req.session.vote || [];
    const votes = req.session.vote;   
     
      const polls = await Poll.findAll({
        include: [
          {
            order: ["title"],
            association: "author",
            attributes: ["pseudo"]
          }
        ]
      });
      
    const { pseudo, password } = req.body;
      
    if (!pseudo || !password){
      res.render("frontPage", { polls, votes,errorMessage: "Incorrect username or password"});
      return;
    }

    const user = await User.findOne({
      where: { pseudo },      

    });

    const isMatching = await bcrypt.compare(password, user.password);

    if(!isMatching){
      res.render("frontPage", {polls, votes,errorMessage: "Incorrect username or password"});
      return;
    }

    req.session.userId = user.id;

    res.render("frontPage", {polls, votes});

  },

  async logoutAndRedirect(req, res) {
    // On veut retirer le userId de la session
    req.session.userId = null;
    res.redirect("/");
  }

}

module.exports = userAuthController;