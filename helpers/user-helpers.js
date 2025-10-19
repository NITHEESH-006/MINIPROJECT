var db=require('../Config/connection')
var collection=require('../Config/collections')
var ObjectId=require('mongodb').ObjectId
const bcrypt=require('bcrypt')
const Razorpay = require('razorpay');
const { response } = require('../app');
const { resolve } = require('path');


var instance = new Razorpay({
  key_id: 'rzp_test_q8OJJIyAJK5mkM',
  key_secret: '9xMUH9HMhxtoY5i5bTRASZQZ',
});

module.exports={

    getCricketNEWS:()=>{
        return new Promise(async(resolve,reject)=>{
            let news=await db.get().collection(collection.CRICKET_COLLECTION).find().sort({_id:-1}).toArray()
            resolve(news)
        })
    },

    getFootballNEWS:()=>{
        return new Promise(async(resolve,reject)=>{
            let news=await db.get().collection(collection.FOOTBALL_COLLECTION).find().sort({_id:-1}).toArray()
            resolve(news)
        })
    },

    getOtherNEWS:()=>{
        return new Promise(async(resolve,reject)=>{
            let news=await db.get().collection(collection.OTHER_COLLECTION).find().sort({_id:-1}).toArray()
            resolve(news)
        })
    },
    doUserSignup:(userData)=>{  
        return new Promise(async(resolve,reject)=>{
          let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
              resolve({ status: false});
            }else{
              userData.Password=await bcrypt.hash(userData.Password,10)
              db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                userData._id=data.insertedId;
            resolve({userData,status:true})
            })
            }
        })
    },

    doUserLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("login suceess");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            } else{
                console.log("login failed not found");
                resolve({status:false})
            }
        })
    },

    userContact:(content)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CONTACT_COLLECTION).insertOne(content).then((response)=>{
                resolve(response)
            })
        })
    },

    getUserMsg:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:new ObjectId(userId)})
            console.log(user)
            if(user){
                db.get().collection(collection.REPLAY_COLLECTION).find({userId:userId}).sort({_id:-1}).toArray().then((response)=>{
                    console.log(response)
                    resolve(response)
                })
            }
        })
    },

    getTrendingNews:()=>{
            return new Promise(async(resolve,reject)=>{
                let cnews=await db.get().collection(collection.CRICKET_COLLECTION).find().sort({_id:-1}).limit(1).toArray()
                let fnews=await db.get().collection(collection.FOOTBALL_COLLECTION).find().sort({_id:-1}).limit(1).toArray()
                let onews=await db.get().collection(collection.OTHER_COLLECTION).find().sort({_id:-1}).limit(1).toArray()
               
                resolve({
                    cnews: cnews[0],
                    fnews: fnews[0],
                    onews: onews[0]
                  });
            })
        },

        getBookmark: (userId, artId) => {
            let artObj = {
                item: new ObjectId(artId)
            }
        
            return new Promise(async (resolve, reject) => {
                let userBookmark = await db.get().collection(collection.BOOKMARK_COLLECTION).findOne({ user: new ObjectId(userId) })
        
                if (userBookmark) {
                    let articleExist = userBookmark.article?.findIndex(article => article.item.equals(new ObjectId(artId)))
                    if (articleExist != -1) {
                        
                        db.get().collection(collection.BOOKMARK_COLLECTION)
                            .updateOne(
                                { user: new ObjectId(userId) },
                                { $pull: { article: { item: new ObjectId(artId) } } }
                            ).then(() => {
                                resolve({ removed: true })
                            })
                    } else {
                       
                        db.get().collection(collection.BOOKMARK_COLLECTION)
                            .updateOne(
                                { user: new ObjectId(userId) },
                                { $push: { article: artObj } }
                            ).then(() => {
                                resolve({ added: true })
                            })
                    }
                } else {
                    let bookObj = {
                        user: new ObjectId(userId),
                        article: [artObj]
                    }
                    db.get().collection(collection.BOOKMARK_COLLECTION).insertOne(bookObj).then((response) => {
                        resolve({ added: true })
                    })
                }
            })
        },

        getBookmarkArticle: (userId) => {
            return new Promise(async (resolve, reject) => {
              const bookmarks = await db.get().collection(collection.BOOKMARK_COLLECTION).aggregate([
                {
                  $match: { user: new ObjectId(userId) }
                },
                {
                  $unwind: "$article"
                },
                {
                  $project: {
                    item: "$article.item"
                  }
                },
          
                // Lookups with type tagging
                {
                  $lookup: {
                    from: collection.CRICKET_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "cricket"
                  }
                },
                {
                  $lookup: {
                    from: collection.FOOTBALL_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "football"
                  }
                },
                {
                  $lookup: {
                    from: collection.OTHER_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "other"
                  }
                },
                {
                  $project: {
                    cricket: {
                      $map: {
                        input: "$cricket",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "cricket" }] }
                      }
                    },
                    football: {
                      $map: {
                        input: "$football",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "football" }] }
                      }
                    },
                    other: {
                      $map: {
                        input: "$other",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "other" }] }
                      }
                    }
                  }
                },
                {
                  $project: {
                    article: { $concatArrays: ["$cricket", "$football", "$other"] }
                  }
                },
                {
                  $match: { article: { $ne: [] } }
                },
                {
                  $unwind: "$article"
                }
              ]).toArray();
          
              const exclusive = await db.get().collection(collection.BOOKMARK_COLLECTION).aggregate([
                {
                  $match: { user: new ObjectId(userId) }
                },
                {
                  $unwind: "$article"
                },
                {
                  $project: {
                    item: "$article.item"
                  }
                },
                {
                  $lookup: {
                    from: collection.EXCLUSIVEARTICLE_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "exclusiveArticle"
                  }
                },
                {
                  $lookup: {
                    from: collection.EXCLUSIVEVIDEO_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "exclusiveVideo"
                  }
                },
                {
                  $project: {
                    exclusiveArticle: {
                      $map: {
                        input: "$exclusiveArticle",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "article" }] }
                      }
                    },
                    exclusiveVideo: {
                      $map: {
                        input: "$exclusiveVideo",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "video" }] }
                      }
                    }
                  }
                },
                {
                  $project: {
                    article: { $concatArrays: ["$exclusiveArticle", "$exclusiveVideo"] }
                  }
                },
                {
                  $match: { article: { $ne: [] } }
                },
                {
                  $unwind: "$article"
                }
              ]).toArray();
          
              resolve({
                bookmarks: bookmarks.map(b => b.article),
                exbookmarks: exclusive.map(b => {
                  const article = b.article;
                  if (article.type === "video") {
                    article.video = true;
                  }
                  return article;
                })
              });
              
            });
          },

          getLiked: (userId, artId) => {
            let artObj = {
                item: new ObjectId(artId)
            }
        
            return new Promise(async (resolve, reject) => {
                let userLiked = await db.get().collection(collection.LIKE_COLLECTION).findOne({ user: new ObjectId(userId) })
        
                if (userLiked) {
                    let articleExist = userLiked.article?.findIndex(article => article.item.equals(new ObjectId(artId)))
                    if (articleExist != -1) {
                        
                        db.get().collection(collection.LIKE_COLLECTION)
                            .updateOne(
                                { user: new ObjectId(userId) },
                                { $pull: { article: { item: new ObjectId(artId) } } }
                            ).then(() => {
                                resolve({ removed: true })
                            })
                    } else {
                       
                        db.get().collection(collection.LIKE_COLLECTION)
                            .updateOne(
                                { user: new ObjectId(userId) },
                                { $push: { article: artObj } }
                            ).then(() => {
                                resolve({ added: true })
                            })
                    }
                } else {
                    let bookObj = {
                        user: new ObjectId(userId),
                        article: [artObj]
                    }
                    db.get().collection(collection.LIKE_COLLECTION).insertOne(bookObj).then((response) => {
                        resolve({ added: true })
                    })
                }
            })
        },

        getLikedArticle: (userId) => {
            return new Promise(async (resolve, reject) => {
              const liked = await db.get().collection(collection.LIKE_COLLECTION).aggregate([
                {
                  $match: { user: new ObjectId(userId) }
                },
                {
                  $unwind: "$article"
                },
                {
                  $project: {
                    item: "$article.item"
                  }
                },
          
                // Lookups with type tagging
                {
                  $lookup: {
                    from: collection.CRICKET_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "cricket"
                  }
                },
                {
                  $lookup: {
                    from: collection.FOOTBALL_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "football"
                  }
                },
                {
                  $lookup: {
                    from: collection.OTHER_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "other"
                  }
                },
                {
                  $project: {
                    cricket: {
                      $map: {
                        input: "$cricket",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "cricket" }] }
                      }
                    },
                    football: {
                      $map: {
                        input: "$football",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "football" }] }
                      }
                    },
                    other: {
                      $map: {
                        input: "$other",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "other" }] }
                      }
                    }
                  }
                },
                {
                  $project: {
                    article: { $concatArrays: ["$cricket", "$football", "$other"] }
                  }
                },
                {
                  $match: { article: { $ne: [] } }
                },
                {
                  $unwind: "$article"
                }
              ]).toArray();
          
              const exclusive = await db.get().collection(collection.LIKE_COLLECTION).aggregate([
                {
                  $match: { user: new ObjectId(userId) }
                },
                {
                  $unwind: "$article"
                },
                {
                  $project: {
                    item: "$article.item"
                  }
                },
                {
                  $lookup: {
                    from: collection.EXCLUSIVEARTICLE_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "exclusiveArticle"
                  }
                },
                {
                  $lookup: {
                    from: collection.EXCLUSIVEVIDEO_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "exclusiveVideo"
                  }
                },
                {
                  $project: {
                    exclusiveArticle: {
                      $map: {
                        input: "$exclusiveArticle",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "article" }] }
                      }
                    },
                    exclusiveVideo: {
                      $map: {
                        input: "$exclusiveVideo",
                        as: "item",
                        in: { $mergeObjects: ["$$item", { type: "video" }] }
                      }
                    }
                  }
                },
                {
                  $project: {
                    article: { $concatArrays: ["$exclusiveArticle", "$exclusiveVideo"] }
                  }
                },
                {
                  $match: { article: { $ne: [] } }
                },
                {
                  $unwind: "$article"
                }
              ]).toArray();
          
              resolve({
                liked: liked.map(b => b.article),
                exliked: exclusive.map(b => {
                  const article = b.article;
                  if (article.type === "video") {
                    article.video = true;
                  }
                  return article;
                })
              });
              
            });
          },

          generatePremiumOrder: (userId, amount) => {
            return new Promise((resolve, reject) => {
              const options = {
                amount: amount * 100,
                currency: "INR",
                receipt: "premium_" + userId,
                notes: { userId }
              };
          
              instance.orders.create(options, (err, order) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(order);
                }
              });
            });
          },
          
          verifyPayment: (details) => {
            return new Promise((resolve, reject) => {
              const crypto = require('crypto');
              const hmac = crypto.createHmac('sha256', '9xMUH9HMhxtoY5i5bTRASZQZ');
          
              const data = details.razorpay_order_id + "|" + details.razorpay_payment_id;
              hmac.update(data);
          
              const generatedSignature = hmac.digest('hex');
          
              if (generatedSignature === details.razorpay_signature) {
                resolve();
              } else {
                reject("Payment verification failed");
              }
            });
          },          
          
          setPremiumStatus: (userId) => {
            return db.get().collection(collection.USER_COLLECTION).updateOne(
              { _id: new ObjectId(userId) },
              { $set: { isPremium: true } }
            );
          },
          getUserById: (userId) => {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(userId) })
                    .then((user) => {
                        resolve(user);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        },

        getLikeCount:(userId)=>{
          return new Promise((resolve,reject)=>{
            db.get().collection(collection.LIKE_COLLECTION).aggregate([
              { $unwind: "$article" },
              { 
                  $group: {
                      _id: "$article.item",
                      likeCount: { $sum: 1 }
                  }
              },
              {
                  $lookup: {
                      from: collection.CRICKET_COLLECTION,
                      localField: "_id",
                      foreignField: "_id",
                      as: "cricket"
                  }
              },
              {
                  $lookup: {
                      from: collection.FOOTBALL_COLLECTION,
                      localField: "_id",
                      foreignField: "_id",
                      as: "football"
                  }
              },
              {
                  $lookup: {
                      from: collection.OTHER_COLLECTION,
                      localField: "_id",
                      foreignField: "_id",
                      as: "other"
                  }
              },
              {
                  $lookup: {
                      from: collection.EXCLUSIVEARTICLE_COLLECTION,
                      localField: "_id",
                      foreignField: "_id",
                      as: "exclusiveArticle"
                  }
              },
              {
                  $lookup: {
                      from: collection.EXCLUSIVEVIDEO_COLLECTION,
                      localField: "_id",
                      foreignField: "_id",
                      as: "exclusiveVideo"
                  }
              },
              {
                  $project: {
                      _id: 1,
                      likeCount: 1,
                      details: { 
                          $concatArrays: ["$cricket", "$football", "$other", "$exclusiveArticle", "$exclusiveVideo"] 
                      }
                  }
              }
          ]).toArray().then((likeCount)=>
             resolve(likeCount))
          })
        },

    getSearch:(query)=>{

      return new Promise((resolve,reject)=>{
       const collections = [
        collection.CRICKET_COLLECTION,
        collection.FOOTBALL_COLLECTION,
        collection.OTHER_COLLECTION,
        // collection.EXCLUSIVEARTICLE_COLLECTION,
        // collection.EXCLUSIVEVIDEO_COLLECTION
      ];

      const lowerQuery = query.toLowerCase();

      const results = collections.map(col => {
        return db.get().collection(col).find().toArray()
          .then(docs => docs.filter(article =>
            typeof article.title === 'string' &&
            article.title.toLowerCase().includes(lowerQuery)
          ));
      });

      Promise.all(results)
        .then(results =>
           resolve(results.flat()))

          })
        },

}