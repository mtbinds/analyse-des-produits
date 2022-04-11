const mongoose = require('mongoose');
var Produit = require("./models/produit");
var Symptome= require("./models/symptome");
var Comment = require("./models/comment");
var Message = require("./models/message");


var data = [{
        name: "Humpy Hill",
        image: "https://images.unsplash.com/photo-1526491109672-74740652b963?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
        description: "Love the Dolor sit amet consectetur adipiscing elit duis tristique sollicitudin nibh. Lectus proin nibh nisl condimentum id venenatis a condimentum. Sit amet mauris commodo quis imperdiet massa tincidunt. Faucibus nisl tincidunt eget nullam non. Feugiat vivamus at augue eget arcu dictum varius duis at. Sed id semper risus in hendrerit. Pellentesque pulvinar pellentesque habitant morbi tristique senectus et. Ultrices tincidunt arcu non sodales neque sodales ut. Posuere sollicitudin aliquam ultrices sagittis orci a. Ac tortor vitae purus faucibus ornare suspendisse sed nisi lacus. Non odio euismod lacinia at quis risus. Sed felis eget velit aliquet sagittis. Condimentum vitae sapien pellentesque habitant morbi tristique. Purus gravida quis blandit turpis cursus in hac."
    },
    {
        name: "Paradiso",
        image: "https://images.unsplash.com/photo-1510277861473-16b27b39c47a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
        description: "Dolor sit amet consectetur adipiscing elit duis tristique sollicitudin nibh. Lectus proin nibh nisl condimentum id venenatis a condimentum. Sit amet mauris commodo quis imperdiet massa tincidunt. Faucibus nisl tincidunt eget nullam non. Feugiat vivamus at augue eget arcu dictum varius duis at. Sed id semper risus in hendrerit. Pellentesque pulvinar pellentesque habitant morbi tristique senectus et. Ultrices tincidunt arcu non sodales neque sodales ut. Posuere sollicitudin aliquam ultrices sagittis orci a. Ac tortor vitae purus faucibus ornare suspendisse sed nisi lacus. Non odio euismod lacinia at quis risus. Sed felis eget velit aliquet sagittis. Condimentum vitae sapien pellentesque habitant morbi tristique. Purus gravida quis blandit turpis cursus in hac.!!"
    },
    {
        name: "Swan Lake",
        image: "https://images.unsplash.com/photo-1547706276-da514c3f4ad6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
        description: "Dolor sit amet consectetur adipiscing elit duis tristique sollicitudin nibh. Lectus proin nibh nisl condimentum id venenatis a condimentum. Sit amet mauris commodo quis imperdiet massa tincidunt. Faucibus nisl tincidunt eget nullam non. Feugiat vivamus at augue eget arcu dictum varius duis at. Sed id semper risus in hendrerit. Pellentesque pulvinar pellentesque habitant morbi tristique senectus et. Ultrices tincidunt arcu non sodales neque sodales ut. Posuere sollicitudin aliquam ultrices sagittis orci a. Ac tortor vitae purus faucibus ornare suspendisse sed nisi lacus. Non odio euismod lacinia at quis risus. Sed felis eget velit aliquet sagittis. Condimentum vitae sapien pellentesque habitant morbi tristique. Purus gravida quis blandit turpis cursus in hac."
    }
]


// Async + Await version of seedDB()
async function seedDB() {
    try {
        await Produit.remove({});
        console.log("Produit supprimé");
        await Comment.remove({});
        console.log("Commentaire supprimé");
        await Message.remove({});
        console.log("Message supprimé");
        for (const seed of data) {
            let produit = await Produit.create(seed);
            console.log("Produit crée");
            let symptome = await Symptome.create(seed);
            console.log("Symptôme crée");
            let comment = await Comment.create({
                text: "C'est génial !!!",
                author: "Madjid"
            })
            console.log("Commentaire crée");
            console.log("Message crée");
            produit.comments.push(comment);
            produit.messages.push(message);
            produit.messages.replies.push(reply);
            produit.save();
            console.log("Commentaire ajouté au produit");
            console.log("Message ajouté au produit");
        }
    } catch (err) {
        console.log(err);
    }
}



// function seedDB(){
//     // Remove all campgrounds
//     Produit.remove({}, (err) =>{
//         if(err){
//             console.log(err);
//         }
//         console.log("REMOVED CAMPGROUNDS");
//         // Add new campgrounds
//         data.forEach(seed =>{
//             Produit.create(seed, (err, produit) =>{
//                 if(err){
//                     console.log(err);
//                 }else{
//                     console.log("Added new produit");
//                     // Create new comment
//                     Comment.create(
//                         {
//                             text: "Wow So Cool!!!",
//                             author: "Homer"
//                         }, function(err, comment){
//                             if(err){
//                                 console.log(err);
//                             } else {
//                                 produit.comments.push(comment);
//                                 produit.save();
//                                 console.log("Created new comment");
//                             }
//                         });
//                 }
//             })
//         })
//     });
// }

module.exports = seedDB;
