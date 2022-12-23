const express = require("express");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { User, Post, Comment } = require("./models");
const authMiddleware = require("./middlewares/auth-middleware");

const router = express.Router();

const app = express();

app.use(express.json());


// 회원가입
router.post("/signup", async (req, res) => {
  
  try{
    const { nickname, password, confirm } = req.body;

    if(!/^([a-zA-z0-9]).{2,}$/.test(nickname)) {
      res.status(412).send({
          errorMessage: "ID의 형식이 일치하지 않습니다.",
      });
      return;
    }

    if(!/^([a-zA-z0-9]).{3,}$/.test(password)) {
      res.status(412).send({
        errorMessage: "패스워드 형식이 일치하지 않습니다.",
      });
      return;
    }

    if(password.search(nickname) > -1) {
      res.status(412).send({
        errorMessage: "패스워드에 닉네임이 포함되어 있습니다.",
      });
      return;
    }
 
    if (password !== confirm) {
      res.status(412).send({
        errorMessage: "패스워드가 일치하지 않습니다.",
      });
      return;
    }
  
    const existUser = await User.findAll({ where: { nickname } });
    if (existUser.length) {
      res.status(412).send({
        errorMessage: "중복된 닉네임입니다.",
      });
      return;
    }
  
    await User.create({ nickname, password });
  
    res.status(201).send({ message: "회원 가입에 성공하였습니다." });

  } catch(error) {
    res.status(400).send({
      errorMessage: "요청한 데이터 형식이 올바르지 않습니다."
    });
  }

});

// 로그인
router.post("/login", async (req, res) => {
  try{
    const { nickname, password } = req.body;

    const user = await User.findOne({ where: { nickname, password } });

    if (!user) {
      res.status(412).send({
        errorMessage: "닉네임 또는 패스워드를 확인해주세요.",
      });
      return;
    }

    const token = jwt.sign({ userId: user.userId }, 
      "customized-secret-key",
      { expiresIn: "1d" }
    );
    res.json({"token": token});

  } catch(error) {
    res.status(400).json({
      errorMessage: "로그인에 실패하였습니다."
    });
  }
  
});

router.get("/users/me", authMiddleware, async (req, res) => {
  const { user } = res.locals;
  res.send({
    user,
  });
});

// 게시글 작성
router.post("/posts", authMiddleware, async(req,res) =>{
  try {
    const { userId } = res.locals.user;
    const { title, content } = req.body;
  
    if(Object.keys(req.body).length === 0){
      res.status(412).send({
        errorMessage: "데이터 형식이 올바르지 않습니다."
      });
      return;
    }
  
    if(!title){
      res.status(412).send({
        errorMessage: "게시글 제목의 형식이 일치하지 않습니다."
      });
      return;
    }
  
    if(!content){
      res.status(412).send({
        errorMessage: "게시글 내용의 형식이 일치하지 않습니다."
      });
      return;
    }
  
    await Post.create({ title, content, userId })
    res.status(201).send({ message: "게시글 작성에 성공하였습니다." });

  } catch(error) {
    res.status(400).json({
      errorMessage: "게시글 작성에 실패하였습니다."
    });
  }

})

// 게시글 조회
router.get("/posts", async(req, res) => {
  try{
    const posts = await Post.findAll({
      include: [{
        model: User,
        required: false,
        attributes: ['nickname'],
      }]
    });
  
    res.json({"data": posts});
  } catch(error) {
    res.status(400).json({
      errorMessage: "게시글 조회에 실패하였습니다."
    });
  }

})

// 게시글 상세 조회
router.get("/posts/:postId", async(req,res) => {
  try{
    const { postId } = req.params;
    const post = await Post.findOne({
      where: { postId },
      include: [{
        model: User,
        required: false,
        attributes: ['nickname'],
      }]
    });
    res.json({"data": post});
  } catch(error) {
    res.status(400).json({
      errorMessage: "게시글 조회에 실패하였습니다."
    });
  }

})

// 게시글 수정
router.put("/posts/:postId", authMiddleware, async(req,res) => {
  try{
    if(Object.keys(req.body).length === 0){
      res.status(412).send({
        errorMessage: "데이터 형식이 올바르지 않습니다."
      });
      return;
    }
  
    const { userId } = res.locals.user;
    const { title, content } = req.body;
    const { postId } = req.params;
  
    if(!title){
      res.status(412).send({
        errorMessage: "게시글 제목의 형식이 일치하지 않습니다."
      });
      return;
    }  
  
    if(!content){
      res.status(412).send({
        errorMessage: "게시글 내용의 형식이 일치하지 않습니다."
      });
      return;
    }  
  
    const post = await Post.findOne({
      where: { postId, userId }
    });
  
    if(!post){
      res.status(401).send({
        errorMessage: "게시글이 정상적으로 수정되지 않았습니다."
      });
      return;
    }
  
    post.title = title;
    post.content = content;
    await post.save();
    res.status(200).send({ message: "게시글을 수정하였습니다." });
  } catch(error) {
    res.status(400).json({
      errorMessage: "게시글 수정에 실패하였습니다"
    });
  }

})

// 게시글 삭제
router.delete("/posts/:postId", authMiddleware, async(req,res) =>{
  try{
    const { userId } = res.locals.user;
    const { postId } = req.params;

    const existPost = await Post.findByPk(postId);
    if(!existPost) {
      res.status(404).send({
        errorMessage: "게시글이 존재하지 않습니다."
      });
      return;
    }

    const post = await Post.findOne({
      where: { postId, userId }
    });

    if(!post){
      res.status(401).send({
        errorMessage: "게시글이 정상적으로 삭제되지 않았습니다."
      });
      return;
    }

    await post.destroy();
    res.status(200).send({ message: "게시글을 삭제하였습니다." });
  } catch(error) {
    res.status(400).json({
      errorMessage: "게시글 삭제에 실패하였습니다"
    });
  }

})

// 댓글 생성
router.post("/comments/:postId", authMiddleware, async(req,res) => {
  try {
    const { userId } = res.locals.user;
    const { postId } = req.params;
    const { comment } = req.body;

    if(Object.keys(req.body).length === 0){
      res.status(412).send({
        errorMessage: "데이터 형식이 올바르지 않습니다."
      });
      return;
    }

    await Comment.create({ comment, postId, userId })
    res.status(201).send({ message: "댓글을 작성하였습니다." });
  } catch(error) {
    res.status(400).json({
      errorMessage: "댓글 작성에 실패하였습니다."
    });
  }

})

// 댓글 목록 조회
router.get("/comments/:postId", async(req,res) => {
  try {
    const { postId } = req.params;
    const comment = await Comment.findAll({
      where: { postId },
      include: [{
        model: User,
        required: false,
        attributes: ['nickname'],
      }]
    });
    res.json({"data": comment});
  } catch(error) {
    res.status(400).json({
      errorMessage: "댓글 조회에 실패하였습니다."
    });
  }
  
})

// 댓글 수정
router.put("/comments/:commentId", authMiddleware, async(req,res) => {
  try {
    const { userId } = res.locals.user;
    const { commentId } = req.params;
    const { comment } = req.body;
  
    if(!comment){
      res.status(412).send({
        errorMessage: "데이터 형식이 올바르지 않습니다."
      });
      return;
    }
  
    const existCmt = await Comment.findByPk(commentId);
    if(!existCmt) {
      res.status(404).send({
        errorMessage: "댓글이 존재하지 않습니다."
      });
      return;
    }
  
    const findcmt = await Comment.findOne({
      where: { commentId, userId }
    });
  
    if(!findcmt){
      res.status(400).send({
        errorMessage: "댓글 수정이 정상적으로 처리되지 않았습니다."
      });
      return;
    }
  
    findcmt.comment = comment;
    await findcmt.save();
    res.status(200).send({ message: "댓글을 수정하였습니다." });
  } catch(error) {
    res.status(400).json({
      errorMessage: "댓글 수정에 실패하였습니다."
    });
  }

})

// 댓글 삭제
router.delete("/comments/:commentId", authMiddleware, async(req,res) => {
  try {
    const { userId } = res.locals.user;
    const { commentId } = req.params;

    const existCmt = await Comment.findByPk(commentId);
    if(!existCmt) {
      res.status(404).send({
        errorMessage: "댓글이 존재하지 않습니다."
      });
      return;
    }

    const findcmt = await Comment.findOne({
      where: { commentId, userId }
    });

    if(!findcmt){
      res.status(400).send({
        errorMessage: "댓글 삭제가 정상적으로 처리되지 않았습니다."
      });
      return;
    }

    await findcmt.destroy();
    res.status(200).send({ message: "댓글을 삭제하였습니다." })
  } catch(error) {
    res.status(400).json({
      errorMessage: "댓글 삭제에 실패하였습니다."
    });
  }

})




app.use("/api", express.urlencoded({ extended: false }), router);

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});