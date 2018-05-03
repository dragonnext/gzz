const PostModel = require('../models/posts')
const CommentModel = require('../models/comments')
const express = require('express')
const router = express.Router()
const checkLogin = require('../middlewares/check').checkLogin
//get/posts 所有用户或者特定用户的文章页
//eg:get /posts?author=xxx
router.get('/',function(req,res,next){
	const author = req.query.author
	PostModel.getPosts(author)
	.then(function(posts){
		res.render('posts',{
			posts:posts
		})
	})
	.catch(next)
	// res.render('posts')
})
//post/posts/create发表一篇文章
router.post('/create',checkLogin,function(req,res,next){
	const author = req.session.user._id
	const title = req.fields.title
	const content = req.fields.content
	//校验参数
	try{
		if(!title.length){
			throw new Error('请填写标题')
		}
		if(!content.length){
			throw new Error('请填写内容')
		}
	} catch (e) {
		req.flash('error',e.message)
		return res.redirect('back')
	}
	let post = {
		author:author,
		title:title,
		content:content
	}
	PostModel.create(post)
	.then(function(result){
		// 此post是插入 mongodb后的值，包含_id
		post = result.ops[0]
		req.flash('success','发表成功')
		//发表成功后跳转到该文章页
		res.redirect(`/posts/${post._id}`)
	})
	.catch(next)
})
router.get('/create',checkLogin,function(req,res,next){
	res.render('create')
})
//GET/posts/:postId单独一篇的文章页
router.get('/:postId',function(req,res,next){
	const postId = req.params.postId
	Promise.all([
		PostModel.getPostById(postId),//获取文章信息
		CommentModel.getComments(postId),//获取该文章的所有留言
		PostModel.incPv(postId)//pv加1
	])
	.then(function(result){
		const post = result[0]
		const comments = result[1]
		console.log('133')
		console.log(result)
		if(!post){
			throw new Error('该文章不存在')
		}
		res.render('post',{
			post:post,
			comments:comments
		})
	})
	.catch(next)
	// res.send('文章详情页')
})
router.get('/:postId/edit',checkLogin,function(req,res,next){
	const postId = req.params.postId
	const author = req.session.user._id

	PostModel.getRawPostById(postId)
	.then(function(post){
		if(!post){
			throw new Error('该文章不存在')
		}
		if(author.toString()!==post.author._id.toString()){
			throw new Error('权限不足')
		}
		res.render('edit',{
			post:post
		})
	})
	.catch(next)
	// res.send('更新文章页')
})
router.post('/:postId/edit',checkLogin,function(req,res,next){
	const postId = req.params.postId
	const author = req.session.user._id
	const title = req.fields.title
	const content = req.fields.content

	//校验参数
	try{
		if(!title.length){
			throw new Error('请填写标题')
		}
		if(!content.length){
			throw new Error('请填写内容')
		}
	}catch(e){
		req.flash('error',e.message)
		return res.redirect(back)
	}
	PostModel.getRawPostById(postId)
	.then(function(post){
		if(!post){
			throw new Error('文章不存在')
		}
		if(post.author._id.toString()!==author.toString()){
			throw new Error('没有权限')
		}
		PostModel.updatePostById(postId,{title:title,content:content})
		.then(function(){
			req.flash('success','编辑文章成功')
			console.log(`${postId}`)
			//编辑成功后跳转到上一页
			res.redirect(`/posts/${postId}`)
		})
		.catch(next)
	})
	// res.send('更新文章')
})
router.get('/:postId/remove',checkLogin,function(req,res,next){
	const postId = req.params.postId
	const author = req.session.user._id

	PostModel.getRawPostById(postId)
	.then(function(post){
		if(!post){
			throw new Error('文章不存在')
		}
		if(post.author._id.toString()!==author.toString()){
			throw new Error('没有权限')
		}
		PostModel.delPostById(postId)
		.then(function(){
			req.flash('success','删除文章成功')
			//删除成功后跳转到主页
			res.redirect('/posts')
		})
		.catch(next)
	})
	// res.send('删除文章')
})
module.exports = router