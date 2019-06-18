const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Post model
const Post = require('../../models/Post');
// Profile model
const Profile = require('../../models/Profile');

// Validation
const validatePostInput = require('../../validation/post');

// @route    GET api/posts/test
// @desc     Tests post route
// @access   public
router.get('/test', (req, res) => res.json({msg: "Posts Works"}));

// @route    POST api/posts
// @desc     Get posts
// @access   public

router.get('/', (req, res, next) => {
    Post.find()
        .sort({date : -1})
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({ nopostfound: 'No post found with that Id'}));
});

// @route    POST api/posts/:id
// @desc     Get posts
// @access   public

router.get('/:id', (req, res, next) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({ nopostfound: 'No post found with that Id'}));
});


// @route    POST api/posts/
// @desc     Creare post
// @access   private
router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      const { errors, isValid } = validatePostInput(req.body);
  
      // Check Validation
      if (!isValid) {
        // If any errors, send 400 with errors object
        return res.status(400).json(errors);
      }
  
      const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
      });
  
      newPost.save().then(post => res.json(post));
    }
  );
  

  // @route   DELETE api/posts/:id
  // @desc     Delete post
  // @access   private

router.delete('/:id', passport.authenticate('jwt', { session: false}) ,(req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
          Post.findById(req.params.id)
              .then(post => {
                if(post.user.toString() !== req.user.id ) {
                  return res.status(401).json({ notauthorised: 'user not authorised'})
                }
                post.remove().then(() => res.json({ success: true}))
              })
              .catch(err => res.status(404).json({ postnotfound: 'No post found' } ))
        })
});

  // @route   POST api/posts/like/:id
  // @desc     Like post
  // @access   private

router.post('/like/:id', passport.authenticate('jwt', { session: false}) ,(req, res) => {
  Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id)
            .then(post => {
              //check if user already liked the post
              if(post.likes.filter(likes => likes.user.toString() === req.user.id ).length > 0) {
                return res.status(400).json({ alreadyliked: 'User already liked the post'})
              }  
              post.likes.unshift({ user: req.user.id });
              post.save().then(post => res.json(post));
            })
            .catch(err => res.status(404).json({ postnotfound: 'No post found' } ))
      })
});

  // @route   POST api/posts/unlike/:id
  // @desc     unLike post
  // @access   private

  router.post('/unlike/:id', passport.authenticate('jwt', { session: false}) ,(req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
          Post.findById(req.params.id)
              .then(post => {
                //check if user already liked the post
                if(post.likes.filter(likes => likes.user.toString() === req.user.id ).length ===  0) {
                  return res.status(400).json({ alreadyliked: 'You have not liked the post'})
                }  
                // get remove index
                const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.id)
               //spliceout of array
               post.likes.splice(removeIndex, 1);
                // save
                post.save().then(post => res.json(post));
              })
              .catch(err => res.status(404).json({ postnotfound: 'No post found' } ))
        })
  });

  // @route   POST api/posts/comment/:id/:comment_id
  // @desc     Add comment to post 
  // @access   private

  router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check if comment exist
        if(post.comments.filter( comment => comment._id.toString() === req.params.comment_id).length === 0) {
          return res.status(404).json({ commentnotexist: 'Comment does not exist'})
        }

        // get remove index
        const removeIndex = post.comments.map( item => item._id.toString()).indexOf(req.params.comment_id);

        //Splice comment out of array
        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnofound : 'No post found'}))
  });


  // @route   DELETE api/posts/comment/:id
  // @desc     Delete comment from post 
  // @access   private

  router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
  
    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
    
    Post.findById(req.params.id)
      .then(post => {
          const newComment = {
            text: req.body.text,
            name: req.body.name,
            avatar: req.body.avatar,
            user: req.user.id
          }

          // ADD comment to comment array
          post.comments.unshift(newComment);

          // save
          post.save().then(post => res.json(post))
      })
      .catch(err => res.status(404).json({ postnofound : 'No post found'}))
  });

module.exports = router;