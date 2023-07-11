const PrismaClient = require("@prisma/client").PrismaClient;
const express = require("express");
const bcrypt = require("bcrypt")
const session = require("express-session");
const flash = require('connect-flash');
const multer = require("multer");

const upload = multer({dest:'/uploads'});
const app = express();
app.use(express.static(__dirname + '/views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'CHAVESUPERSECRETA',
  resave: false,
  saveUninitialized: false
}));
app.set('view engine', 'ejs');
const prisma = new PrismaClient();
app.use(flash());


app.get('/cadastro', (req, res) => {
  const success = req.flash('success');
  const erro = req.flash('error');
  res.render("html/TelaDeCadastro", { success, erro });
});

app.post("/cadastro",upload.single('imagem') , async(req,res)=>{
    const {username,imagem,email,genero,cargo,senha} = req.body
    const hash = await bcrypt.hash(senha,12)
    try{
      if(cargo === "Admin" || cargo === "admin"){
      User = await prisma.user.create({
          data:{
              username,
              email,
              genero,
              cargo,
              admin: true,
              imagem,
              senha:hash
          }
      })}
      else{
         User = await prisma.user.create({
              data:{
                  username,
                  email,
                  genero,
                  cargo,
                  admin: false,
                  imagem,
                  senha:hash
              }
      })}
      console.log(User)
      req.session.user_id = User.id
      req.flash('success', 'Cadastro realizado com sucesso');
      res.redirect("/login")
      }catch(e){
        req.flash('error', 'Usuario ou email ja utilizados');
        res.redirect('/cadastro');
      }
  })



  app.get("/login", (req, res) => {
    const success = req.flash('success');
    const error = req.flash('error');
    res.render("html/TelaDeLogin", { success, error });
  });


app.post("/login", async (req, res) => {
  try {
    const usuario = await prisma.user.findUnique({
      where: {
        email: req.body.email
      }
    });
   const valido = await bcrypt.compare(req.body.senha,usuario.senha)
   if (valido){
    req.session.user_id = usuario.id
    console.log("login efetuado com sucesso");
   }else{
    req.flash('error', 'Email ou senha incorretos');
    res.redirect("/login");
    return 
   }
   req.flash('success', 'Login efetuado com sucesso');
   res.redirect("/");

  } catch (e) {
    console.log("Usuario/senha incorreto");
    req.flash('error', 'Usuário/senha incorretos');
    res.redirect("/login");
    res.status(500);
  }
});
  app.get('/recuperacao', async(req, res) => {
    res.sendFile(__dirname + '/views/html/TelaRecuperacaoSenha.html');
  });

  app.post("/recuperacao", async (req, res) => {
    console.log(req.body);
    const { email, senha } = req.body;
    const hash = await bcrypt.hash(senha, 12);
    const usuario = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        senha: hash,
      },
    });
    console.log(usuario);
    res.redirect("/login");
  });


app.get("/feedlogado",async(req,res)=>{
  if(!req.session.user_id){
    return res.send("VC NAO TEM PERMISSAO PARA ENTAR");
  }
  const posts = await prisma.post.findMany({
    include:{
      User:true,
      coments:true
    }
  })
  const usuarios = await prisma.user.findMany()
  const usuariologado = await prisma.user.findUnique({
    where: {
      id: parseInt(req.session.user_id)
    }
  })
  const erro = req.flash('error');
  const success = req.flash('success');
  res.render("html/feedlogado",{usuarios, usuariologado,posts,success,erro});
})

app.post("/logout",(req,res)=>{
  console.log("Logout efetuado com sucesso");
  req.session.user_id = null
  res.redirect('/login')
})

app.post("/CriarPost",async(req,res)=>{
  const { content } = req.body
  const post = await prisma.post.create({
    data:{
      content,
      user_id:req.session.user_id
    }
  })
  console.log(post);
  res.redirect("/feedlogado");
})

app.get('/perfil/:id', async (req, res) => {
  if (!req.session.user_id) {
    res.send('VOCÊ PRECISA ESTAR LOGADO PARA ENTRAR NESSA PÁGINA');
    return;
  }

  try {
    const usuario = await prisma.user.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        posts: true,
      },
    });
      const usuariologado = await prisma.user.findUnique({
        where:{
          id:req.session.user_id
        }
      })
    res.render('html/perfil', { usuario,usuariologado });
  } catch (error) {
    console.error('Usuario nao encontrado', error);
    res.send('Usuario nao encontrado');
  }
});

app.get("/post/:id",async(req,res)=>{
  if (!req.session.user_id) {
    res.send('VOCÊ PRECISA ESTAR LOGADO PARA ENTRAR NESSA PÁGINA');
    return;
  }
  const id = req.params.id
  const post = await prisma.post.findUnique({
    where:{
      id: parseInt(id)
    },
    include:{
      coments : true
    }
  })
  const usuario = await prisma.user.findUnique({
    where:{
      id: post.user_id
    }
  })
    res.render("html/post.ejs", {post,usuario});
})

app.post("/CriarComent/:id", async(req,res)=>{
  const { content } = req.body
  const post = await prisma.coment.create({
    data:{
      content,
      user_id:req.session.user_id,
      post_id: parseInt(req.params.id)
    }
  })
  console.log(post);
  res.redirect("/feedlogado");
})


app.get("/",async(req,res)=>{
  if(!req.session.user_id){
    const posts = await prisma.post.findMany({
      include:{
        User: true,
        coments:true
      }
    });
  res.render("html/feedaberto", {posts});
  return
  }else{
    const usuario = await prisma.user.findUnique({
      where:{
        id:req.session.user_id
      }
    })
    if(usuario.admin){
      res.redirect("/feedadmin");
      return
    }
    else{
      res.redirect("/feedlogado");
    }
  }
})


app.get("/feedadmin",async(req,res)=>{
    if(!req.session.user_id){
      res.send("vc nao tem permisao para entrar nessa pagina");
      return
    }
    const usuariologado = await prisma.user.findUnique({
      where:{
        id:req.session.user_id
      },
      include:{
        posts: true,
        coments:true
      }
    })
    const posts = await prisma.post.findMany({
      include:{
        User: true,
        coments:true
      }
    });
    if(!usuariologado.admin){
      res.send("vc nao tem permisssao para entrar nessa pagina");
      return
    }else{
      res.render("html/feedadmin",{usuariologado, posts});
    }
})

app.delete('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPost = await prisma.post.delete({
      where: {
        id: parseInt(id)
      }
    });
    console.log(deletedPost);
    res.redirect("/feedadmin");
  } catch (error) {
    console.error('Erro ao deletar o post:', error);
    res.status(500).json({ error: 'Ocorreu um erro ao excluir o post' });
  }
});

app.listen(3000,()=>{
    console.log("Ouvindo na porta 3000");
})