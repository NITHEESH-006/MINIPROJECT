var express = require('express');
var router = express.Router();
var adminHelper=require('../helpers/admin-helpers');
const { response } = require('../app');

const verifyLogin =( req,res,next)=>{
  if(req.session.admin && req.session.admin.loggedIn){
    next();
  }else{
    res.redirect('/adminLogin')
  }
}

/* GET home page. */
router.get('/',verifyLogin, function(req, res, next) {
  res.render('admin/Admin-Home',{admin:true,admin:req.session.admin});
});

router.get('/add-cricket-news',verifyLogin,(req,res)=>{
  res.render('admin/add-cricket-news',{admin:req.session.admin})
})

router.post('/add-cricket-news',(req,res)=>{
  adminHelper.addCricketNews(req.body).then((response)=>{
    let id = response.insertedId;
    let image=req.files.image;
    image.mv('./public/images/'+id+'.jpg',(err,done)=>{  //mv is a middlewear heare fileUpload is the middlewear
      if(!err){
        res.render('admin/add-cricket-news',{admin:req.session.admin})
      }else{
        console.log(err);
      }
    })
  })
})

router.get('/add-football-news',verifyLogin,(req,res)=>{
  res.render('admin/add-football-news',{admin:req.session.admin})
})

router.post('/add-football-news',(req,res)=>{
  adminHelper.addFootballNews(req.body).then((response)=>{
    let id = response.insertedId;
    let image=req.files.image;
    image.mv('./public/images/'+id+'.jpg',(err,done)=>{  //mv is a middlewear heare fileUpload is the middlewear
      if(!err){
        res.render('admin/add-football-news',{admin:req.session.admin})
      }else{
        console.log(err);
      }
    })
  })
})


router.get('/add-other-news',verifyLogin,(req,res)=>{
  res.render('admin/add-other-news',{admin:req.session.admin})
})

router.post('/add-other-news',(req,res)=>{
  adminHelper.addOtherNews(req.body).then((response)=>{
    let id = response.insertedId;
    let image=req.files.image;
    image.mv('./public/images/'+id+'.jpg',(err,done)=>{  //mv is a middlewear heare fileUpload is the middlewear
      if(!err){
        res.render('admin/add-other-news',{admin:req.session.admin})
      }else{
        console.log(err);
      }
    })
  })
})

router.get('/add-exclusive',verifyLogin,(req,res)=>{
  res.render('admin/add-exclusive',{admin:req.session.admin})
})

router.post('/add-exclusive', (req, res) => {
  adminHelper.addExclusive(req.body).then((response) => {
    let id = response.insertedId;

    if (req.body.category === "video") {
      let video = req.files?.video;
      if (video) {
        video.mv('./public/videos/' + id + '.mp4', (err) => {
          if (err) {
            console.error("Upload error:", err);
            return res.send("Upload failed. File might be too large.");
          }
          res.render('admin/add-exclusive', { admin: req.session.admin });
        });
      } else {
        res.render('admin/add-exclusive', { admin: req.session.admin });
      }
    } else {
      let image = req.files?.image;
      if (image) {
        image.mv('./public/images/' + id + '.jpg', (err) => {
          if (err) 
          console.log(err);
          res.render('admin/add-exclusive', { admin: req.session.admin });
        });
      } else {
        res.render('admin/add-exclusive', { admin: req.session.admin });
      }
    }
  });
});

router.get('/all-exclusive',verifyLogin,(req,res)=>{
  adminHelper.getAllExclusive().then(({exca,excv})=>{
    res.render('admin/all-exclusive',{exca,excv,admin:req.session.admin})
  })
})

router.get('/excarticle/:id',verifyLogin,(req,res)=>{
  adminHelper.getExArticle(req.params.id).then((exca)=>{
    res.render('admin/excarticle',{exca,admin:req.session.admin})
  })
})

router.get('/delete-excarticle/:id',verifyLogin,(req,res)=>{
  adminHelper.deleteExArticle(req.params.id).then((response)=>{
    res.redirect('/all-exclusive')
  })
})

router.get('/delete-excvideo/:id',verifyLogin,(req,res)=>{
  adminHelper.deleteExVideo(req.params.id).then((response)=>{
    res.redirect('/all-exclusive')
  })
})

router.get('/edit-excarticle/:id',verifyLogin,(req,res)=>{
  adminHelper.getExArticle(req.params.id).then((exca)=>{
    res.render('admin/edit-excarticle',{exca,admin:req.session.admin})
  })
})

router.post('/edit-excarticle/:id',(req,res)=>{
  let id=req.params.id
  adminHelper.UpdateExArticle(req.params.id,req.body).then(()=>{
    if (req.files && req.files.image) {
      let image = req.files.image;
      image.mv('./public/images/' + id + '.jpg', (err) => {
        if (err) {
          console.log("Image upload failed:", err);
          
        }
        res.redirect('/all-exclusive'); 
      });
    } else {
      res.redirect('/all-exclusive');    
    }
  })
})

router.get('/all-news',verifyLogin,(req,res)=>{
  adminHelper.getAllNews().then((news)=>{
    res.render('admin/all-news',{news,admin:req.session.admin})
  })
})

router.get('/article/:id',verifyLogin,(req,res)=>{
  adminHelper.getArticle(req.params.id).then((article)=>{
    res.render('admin/article',{article,admin:req.session.admin})
  })
})

router.get('/delete-article/:id',verifyLogin,(req,res)=>{
  adminHelper.deleteArticle(req.params.id).then((response)=>{
    res.redirect('/all-news')
  })
})

router.get('/edit-article/:id',verifyLogin,(req,res)=>{
  adminHelper.getArticleDetails(req.params.id).then((article)=>{
    res.render('admin/edit-article',{article,admin:req.session.admin})
  })
})

router.post('/edit-article/:id',(req,res)=>{
  let id=req.params.id
  adminHelper.UpdateArticle(req.params.id,req.body).then(()=>{
    if (req.files && req.files.image) {
      let image = req.files.image;
      image.mv('./public/images/' + id + '.jpg', (err) => {
        if (err) {
          console.log("Image upload failed:", err);
          
        }
        res.redirect('/all-news'); 
      });
    } else {
      res.redirect('/all-news');    
    }
  })
})


router.get('/all-users',verifyLogin,(req,res)=>{
  adminHelper.getAllUsers().then((response)=>{
    res.render('admin/all-users',{response,admin:req.session.admin})
  })
})

router.get('/all-contact',verifyLogin,(req,res)=>{
  adminHelper.getAllContacts().then((response)=>{
    res.render('admin/all-contacts',{response,admin:req.session.admin})
  })
})

router.get('/adminLogin',(req,res)=>{
  if(req.session.admin && req.session.admin.loggedIn){
    res.redirect('/')
  }else{
    
    res.render('admin/adminLogin',{loginErr:req.session.adminLoginErr,admin:true})
    req.session.adminLoginErr=false;
    
  }
})

router.post('/adminLogin',(req,res)=>{
  adminHelper.doAdminLogin(req.body).then((response)=>{
    if(response.status){
      console.log(response)
      //req.session.admin={loggedIn:true}
      req.session.admin = response.admin; 
      req.session.admin.loggedIn = true;
      res.redirect('/')
    }else{
      req.session.adminLoginErr = "INVALID";
      res.redirect('/adminLogin');
    }
  })
})


router.get('/logout',(req,res)=>{
  req.session.admin=null
  req.session.adminLoggedIn=false 
  res.redirect('/adminLogin')
})


router.get('/replay/:id',verifyLogin,(req,res)=>{
  res.render('admin/replay',{ admin: req.session.admin, userId: req.params.id })
})

router.post('/replay/:id',(req,res)=>{
  adminHelper.msgReplay(req.body,req.params.id).then((response)=>{
    res.redirect('/all-contact')
  })
})

router.get('/view-replays',verifyLogin,(req,res)=>{
  adminHelper.getAllReplays().then((response)=>{
    res.render('admin/view-replays',{response,admin: req.session.admin})
  })
})

router.get('/deleteUser/:id',(req,res)=>{
  adminHelper.deleteUser(req.params.id).then((response)=>{
    console.log(req.params.id)
    res.redirect('/all-users')
  })
})


module.exports = router;
