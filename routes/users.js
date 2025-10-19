var express = require('express');
var router = express.Router();
var userHelper=require('../helpers/user-helpers');
var adminHelper=require('../helpers/admin-helpers');
const { response } = require('../app');

const verifyLogin =( req,res,next)=>{
  if(req.session.user && req.session.userLoggedIn){
    next();
  }else{
    res.redirect('/users/login')
  }
}


const verifypremium =( req,res,next)=>{
  if(req.session.user && req.session.userLoggedIn && req.session.user.isPremium){
    next();
  }else{
    res.redirect('/users/upgrade')
  }
}


router.get('/',verifyLogin, function(req, res, next) {
  userHelper.getTrendingNews().then(({cnews,fnews,onews})=>{
    res.render('user/User-Home',{cnews,fnews,onews,user:req.session.user});
  })
});

router.get('/contact',verifyLogin,(req,res)=>{
  res.render('user/contact',{user:req.session.user})
})

router.post('/contact',(req,res)=>{
  userHelper.userContact(req.body).then((response)=>{
    res.redirect('/users/contact')
  })
})

router.get('/about',verifyLogin,(req,res)=>{
  res.render('user/about',{user:req.session.user})
})

router.get('/cricket-news',(req,res)=>{
  userHelper.getCricketNEWS().then((news)=>{
    res.render('user/cricket-news',{news,user:req.session.user})
  })
})

router.get('/football-news',(req,res)=>{
  userHelper.getFootballNEWS().then((news)=>{
    res.render('user/football-news',{news,user:req.session.user})
  })
})

router.get('/other-news',(req,res)=>{
  userHelper.getOtherNEWS().then((news)=>{
    res.render('user/other-news',{news,user:req.session.user})
  })
})

// router.get('/article/:id',(req,res)=>{
//   adminHelper.getArticle(req.params.id).then((article)=>{
//         res.render('user/article',{article,user:req.session.user})
//   })
// })

router.get('/article/:id', verifyLogin, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const articleId = req.params.id;
    
    const likecountArray= await userHelper.getLikeCount(userId);
    const article = await adminHelper.getArticle(req.params.id);
   

    let isBookmarked = false;
    let isLiked = false;

    const { bookmarks } = await userHelper.getBookmarkArticle(userId);
    const { liked } = await userHelper.getLikedArticle(userId);


    if (bookmarks && bookmarks.some(item => item._id.toString() === req.params.id)) {
      isBookmarked = true;
    }

    if (liked && liked.some(item => item._id.toString() === req.params.id)) {
      isLiked = true;
    }

    // ✅ Get like count for this specific article ID
    const likecountObj = likecountArray.find(item => item._id.toString() === articleId);
    const likecount = likecountObj ? likecountObj.likeCount : 0;

    res.render('user/article', { article, user: req.session.user, isBookmarked,isLiked,likecount });
  } catch (err) {
    console.error("Error loading article:", err);
    res.status(500).send("Something went wrong");
  }
});


router.get('/login',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/users')
  }else{
    const err=req.session.userLoginErr;
    req.session.userLoginErr=false;
  res.render('user/login',{loginErr:err})
  
  }
})

router.post('/login',(req,res)=>{
  userHelper.doUserLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/users')
    }else{
      
      req.session.userLoginErr="INVALID USERNAME OR PASSWORD"
      res.redirect('/users/login')
    }
  })
})

router.get('/signup',(req,res)=>{
  const error=req.session.userSignupErr;
    req.session.userSignupErr=null;
  res.render('user/signup',{signupErr:error})
})

router.post('/signup',(req,res)=>{
  userHelper.doUserSignup(req.body).then((response)=>{
    console.log(response)
        if(response.status){
          req.session.user = response.userData;      
          req.session.userLoggedIn=true  
          req.session.userSignupErr = null; 
      res.redirect('/users')
        }else{
          req.session.userSignupErr="ALREADY EXISTS"
          res.redirect('/users/signup')
        }
       
  })
})

router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false    
  res.redirect('/users/login')
})

router.get('/view-messages',verifyLogin,(req,res)=>{
  userHelper.getUserMsg(req.session.user._id).then((response)=>{
    console.log(response)
    res.render('user/view-messages',{response,user:req.session.user})
  })
 
})

router.get('/exclusive', verifypremium, async(req, res) => {
  const userId = req.session.user._id;
    const articleId = req.params.id;
    
    const likecountArray= await userHelper.getLikeCount(userId);

  adminHelper.getAllExclusive().then(({ exca, excv }) => {
    userHelper.getBookmarkArticle(userId).then(({ exbookmarks }) => {
      userHelper.getLikedArticle(userId).then(({ exliked }) => {

const markedExca = exca.map(item => {
  const like = likecountArray.find(l => l._id.toString() === item._id.toString());
  return {
    ...item,
    isBookmarked: exbookmarks?.some(b => b._id.toString() === item._id.toString()),
    isLiked: exliked?.some(l => l._id.toString() === item._id.toString()),
    likecount: like ? like.likeCount : 0
  };
});

const markedExcv = excv.map(video => {
  const like = likecountArray.find(l => l._id.toString() === video._id.toString());
  return {
    ...video,
    isBookmarked: exbookmarks?.some(b => b._id.toString() === video._id.toString()),
    isLiked: exliked?.some(v => v._id.toString() === video._id.toString()),
    likecount: like ? like.likeCount : 0
  };
});

      
        res.render('user/exclusive', {
          exca: markedExca,
          excv: markedExcv,
          user: req.session.user
        });
      });      
    });
  });
});




router.get('/excarticle/:id',async(req,res)=>{
  const userId = req.session.user._id;
   //const userId = req.session.user._id;
    const articleId = req.params.id;
    
    const likecountArray= await userHelper.getLikeCount(userId);
  let isBookmarked = false;
  let isLiked= false;
  adminHelper.getExArticle(req.params.id).then((exca)=>{
    userHelper.getBookmarkArticle(userId).then(({exbookmarks})=>{
      if(exbookmarks.some(item => item._id.toString() === req.params.id)){
        isBookmarked = true;
      }
      userHelper.getLikedArticle(userId).then(({exliked})=>{
        if (exliked.some(item => item._id.toString() === req.params.id)) {
          isLiked = true;
        }
          // ✅ Get like count for this specific article ID
    const likecountObj = likecountArray.find(item => item._id.toString() === articleId);
    const likecount = likecountObj ? likecountObj.likeCount : 0;
        res.render('user/excarticle',{exca, user: req.session.user, isBookmarked,isLiked,likecount})
      })
      })
     
  })

})


router.get('/upgrade',(req,res)=>{
  res.render('user/upgrade',{user:req.session.user})
})

router.get('/account',verifyLogin,(req,res)=>{
  res.render('user/account',{user:req.session.user})
})

router.get('/subscribe',verifyLogin,(req,res)=>{
  res.render('user/subscribe',{user:req.session.user})
})


router.post('/create-order', verifyLogin, async (req, res) => {
  try {
    const userId = req.session.user._id; 
    const amount = 999; 

    
    const order = await userHelper.generatePremiumOrder(userId, amount);
    res.json(order); 
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).send("Order creation failed");
  }
});



router.post('/verify-premium', verifyLogin, async (req, res) => {
  try {
    const { payment, order, userId } = req.body;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payment;

    console.log("Payment details:", payment);

    await userHelper.verifyPayment({ razorpay_payment_id, razorpay_order_id, razorpay_signature, order });

  
    await userHelper.setPremiumStatus(userId);

    
    const updatedUser = await userHelper.getUserById(userId); 
req.session.user = updatedUser;

    res.json({ status: 'success' });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.json({ status: 'error' });
  }
});


router.post('/bookmark/:id',verifyLogin,(req,res)=>{
  userHelper.getBookmark(req.session.user._id,req.params.id).then((result)=>{
    res.json(result)
  })
})

// router.get('/bookmarkart',verifyLogin,(req,res)=>{
//   userHelper.getBookmarkArticle(req.session.user._id).then(({bookmarks,exbookmarks})=>{
//     res.render('user/bookmark',{bookmarks,exbookmarks,user:req.session.user})
//   })
// })


// router.get('/bookmarkart', verifyLogin, (req, res) => {
//   const userId = req.session.user._id;

//   userHelper.getLikedArticle(userId).then(({ liked, exliked }) => {
//     userHelper.getBookmarkArticle(userId).then(({ exbookmarks, bookmarks }) => {
//       const markedExbookmarks = exbookmarks.map(item => ({
//         ...item,
//         isLiked: exliked?.some(likedItem => likedItem._id.toString() === item._id.toString()),
//         isBookmarked: true
//       }));

//       res.render('user/bookmark', {
//         liked,
//         bookmarks,
//         exbookmarks: markedExbookmarks, 
//         exliked,
//         user: req.session.user
//       });
//     });
//   });
// });

router.get('/bookmarkart', verifyLogin, (req, res) => {
  const userId = req.session.user._id;

  // Fetch liked articles and videos
  userHelper.getLikedArticle(userId).then(({ liked, exliked }) => {
    // Fetch bookmarked articles and videos
    userHelper.getBookmarkArticle(userId).then(({ exbookmarks, bookmarks }) => {
      // Get like counts for the exclusive content
      userHelper.getLikeCount(userId).then(likecountArray => {
        const markedExbookmarks = exbookmarks.map(item => {
          const like = likecountArray.find(l => l._id.toString() === item._id.toString());
          return {
            ...item,
            isLiked: exliked?.some(likedItem => likedItem._id.toString() === item._id.toString()),
            isBookmarked: true,
            likecount: like ? like.likeCount : 0 // Add like count for the video
          };
        });

        res.render('user/bookmark', {
          liked,
          bookmarks,
          exbookmarks: markedExbookmarks,
          exliked,
          user: req.session.user
        });
      });
    });
  });
});


router.post('/bookmark/exclusive/:videoId', verifypremium, (req, res) => {
  const userId = req.session.user._id;
  const videoId = req.params.videoId;

  userHelper.getBookmark(userId, videoId).then((result) => {
    res.json(result);  
  }).catch((err) => {
    res.status(500).json({ error: 'Something went wrong!' });
  });
});





router.post('/liked/:id',verifyLogin,(req,res)=>{
  userHelper.getLiked(req.session.user._id,req.params.id).then((result)=>{
    res.json(result)
  })
})



// router.get('/liked',verifyLogin,(req,res)=>{
//   userHelper.getLikedArticle(req.session.user._id).then(({liked,exliked})=>{
//     res.render('user/liked',{liked,exliked,user:req.session.user})
//   })
// })

// router.get('/liked', verifyLogin, (req, res) => {
//   const userId = req.session.user._id;

//   userHelper.getLikedArticle(userId)
//     .then(({ liked, exliked }) => {
//       userHelper.getBookmarkArticle(userId)
//         .then(({ exbookmarks }) => {
//           const markedExliked = exliked.map(item => ({
//             ...item,
//             isLiked: true,
//             isBookmarked: exbookmarks?.some(b => b._id.toString() === item._id.toString())
//           }));

//           res.render('user/liked', {
//             liked,
//             exliked: markedExliked,
//             user: req.session.user
//           });
//         });
//     });
// });

router.get('/liked', verifyLogin, (req, res) => {
  const userId = req.session.user._id;

  // Fetch liked articles and videos
  userHelper.getLikedArticle(userId).then(({ liked, exliked }) => {
    // Fetch bookmarked articles and videos
    userHelper.getBookmarkArticle(userId).then(({ exbookmarks }) => {
      // Get like counts for the exclusive content
      userHelper.getLikeCount(userId).then(likecountArray => {
        const markedExliked = exliked.map(item => {
          const like = likecountArray.find(l => l._id.toString() === item._id.toString());
          return {
            ...item,
            isLiked: true,
            isBookmarked: exbookmarks?.some(b => b._id.toString() === item._id.toString()),
            likecount: like ? like.likeCount : 0 // Add like count for the video
          };
        });

        res.render('user/liked', {
          liked,
          exliked: markedExliked,
          user: req.session.user
        });
      });
    });
  });
});


router.post('/liked/exclusive/:videoId', verifypremium, (req, res) => {
  const userId = req.session.user._id;
  const videoId = req.params.videoId;

  userHelper.getLiked(userId, videoId).then((result) => {
    res.json(result);  
  }).catch((err) => {
    res.status(500).json({ error: 'Something went wrong!' });
  });
});

router.get('/search',verifyLogin,(req,res)=>{
  const user=req.session.user;
  const query=req.query.q;
  if(!query){
    res.redirect('/users')
  }

  userHelper.getSearch(query).then((articles)=>{

      res.render('user/search',{articles,query,user})
  })

})


module.exports = router;
