var db=require('../Config/connection')
var collection=require('../Config/collections')
const { response } = require('../app')
var ObjectId=require('mongodb').ObjectId

module.exports={

    addCricketNews:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CRICKET_COLLECTION).insertOne(details).then((response)=>{
                resolve(response)
            })
        })
    },

    addFootballNews:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.FOOTBALL_COLLECTION).insertOne(details).then((response)=>{
                resolve(response)
            })
        })
    },

    addOtherNews:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.OTHER_COLLECTION).insertOne(details).then((response)=>{
                resolve(response)
            })
        })
    },

    addExclusive:(details)=>{
        return new Promise((resolve,reject)=>{
            if(details.category === "video"){
            db.get().collection(collection.EXCLUSIVEVIDEO_COLLECTION).insertOne(details).then((response)=>{
                resolve(response)
            })
        }else{
            db.get().collection(collection.EXCLUSIVEARTICLE_COLLECTION).insertOne(details).then((response)=>{
                resolve(response)
            })
        }
        })
    },

    getAllExclusive:()=>{
        return new Promise(async(resolve,reject)=>{
            let exca=await db.get().collection(collection.EXCLUSIVEARTICLE_COLLECTION).find().sort({_id:-1}).toArray()
            let excv=await db.get().collection(collection.EXCLUSIVEVIDEO_COLLECTION).find().sort({_id:-1}).toArray()
            resolve({exca,excv})
        })

    },

    getAllNews:()=>{
        return new Promise(async(resolve,reject)=>{
            let cnews=await db.get().collection(collection.CRICKET_COLLECTION).find().sort({_id:-1}).toArray()
            let fnews=await db.get().collection(collection.FOOTBALL_COLLECTION).find().sort({_id:-1}).toArray()
            let onews=await db.get().collection(collection.OTHER_COLLECTION).find().sort({_id:-1}).toArray()
            
            let news=[...cnews,...fnews,...onews]

            resolve(news)
        })
    },

    getArticle:(newsId)=>{
        return new Promise(async(resolve,reject)=>{

             let article=await db.get().collection(collection.CRICKET_COLLECTION).findOne({_id:new ObjectId(newsId)})
                
            if(!article){
                 article=await db.get().collection(collection.FOOTBALL_COLLECTION).findOne({_id:new ObjectId(newsId)})
            }
            
            if(!article){
                 article=await db.get().collection(collection.OTHER_COLLECTION).findOne({_id:new ObjectId(newsId)})
            }

            resolve(article)
            })
        
    },

    deleteArticle:(newsId)=>{
        return new Promise(async(resolve,reject)=>{
            let article=await db.get().collection(collection.CRICKET_COLLECTION).deleteOne({_id:new ObjectId(newsId)})
            
            if(article.deletedCount === 0){
                article=await db.get().collection(collection.FOOTBALL_COLLECTION).deleteOne({_id:new ObjectId(newsId)})
            }

            if(article.deletedCount === 0){
                article=await db.get().collection(collection.OTHER_COLLECTION).deleteOne({_id:new ObjectId(newsId)})
            }
            resolve(article)
        })
    },

    getArticleDetails:(newsId)=>{
        return new Promise(async(resolve,reject)=>{

            let article=await db.get().collection(collection.CRICKET_COLLECTION).findOne({_id:new ObjectId(newsId)})
               
           if(!article){
                article=await db.get().collection(collection.FOOTBALL_COLLECTION).findOne({_id:new ObjectId(newsId)})
           }
           
           if(!article){
                article=await db.get().collection(collection.OTHER_COLLECTION).findOne({_id:new ObjectId(newsId)})
           }
           
           resolve(article)
           })
    },

    UpdateArticle: (newsId, details) => {
        return new Promise(async (resolve, reject) => {
            const update = {
                $set: {
                    title: details.title,
                    author: details.author,
                    date: details.date,
                    description: details.description
                }
            };
    
            let article = await db.get().collection(collection.CRICKET_COLLECTION).updateOne(
                { _id: new ObjectId(newsId) },
                update
            );
    
            if (article.modifiedCount === 0) {
                article = await db.get().collection(collection.FOOTBALL_COLLECTION).updateOne(
                    { _id: new ObjectId(newsId) },
                    update
                );
            }
    
            if (article.modifiedCount === 0) {
                article = await db.get().collection(collection.OTHER_COLLECTION).updateOne(
                    { _id: new ObjectId(newsId) },
                    update
                );
            }
    
            resolve(article);
        });
    },

    doAdminLogin:(adminData)=>{

        return new Promise(async(resolve,reject)=>{
            let response={};
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email})

            if(admin){
                if(adminData.password === admin.password){
                    response.admin=admin;
                    response.status=true;
                    console.log("ADMIN LOGGED");
                    resolve(response)
                }else{
                    console.log('incorrect password');
                    resolve({status:false})
                }
            }else{
                console.log("admin not found")
                resolve({status:false})
            }




        })


    },

    getAllUsers:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).find().toArray().then((response)=>{
                resolve(response)
            })
        })
        
},

getAllContacts:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CONTACT_COLLECTION).find().toArray().then((response)=>{
            resolve(response)
        })
    })
},

msgReplay:(msg,id)=>{
    return new Promise(async(resolve,reject)=>{
       let user=await db.get().collection(collection.USER_COLLECTION).find({_id:new ObjectId(id)})
       if(user){
        db.get().collection(collection.REPLAY_COLLECTION).insertOne({msg, userId: id}).then((response)=>{
            resolve(response)
        })
       }
    })
},

getAllReplays:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.REPLAY_COLLECTION).find().toArray().then((response)=>{
            resolve(response)
        })
    })
},

getExArticle:(id)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.EXCLUSIVEARTICLE_COLLECTION).findOne({_id:new ObjectId(id)}).then((exca)=>{
            resolve(exca)
        })
    })
},


deleteExArticle:(id)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.EXCLUSIVEARTICLE_COLLECTION).deleteOne({_id:new ObjectId(id)}).then((response)=>{
            resolve(response)
        })
     
    })
},

deleteExVideo:(id)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.EXCLUSIVEVIDEO_COLLECTION).deleteOne({_id:new ObjectId(id)}).then((response)=>{
            resolve(response)
        })
     
    })
},


UpdateExArticle: (id, details) => {
    return new Promise((resolve, reject) => {

        db.get().collection(collection.EXCLUSIVEARTICLE_COLLECTION).updateOne(
            { _id: new ObjectId(id) },{
            $set: {
                title: details.title,
                author: details.author,
                date: details.date,
                description: details.description
            }
        }
        ).then((exca)=>{
            
        resolve(exca);
        })

    });
},

deleteUser:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).deleteOne({_id:new ObjectId(userId)}).then((response)=>{
            console.log(response)
            resolve(response)
        })
    })
}

}