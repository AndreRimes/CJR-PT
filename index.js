const PrismaClient = require("@prisma/client").PrismaClient;
const express = require("express");
const bcrypt = require("bcrypt")
const session = require("express-session");
const flash = require('connect-flash');
const marked = require('marked');

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

app.post("/cadastro", async(req,res)=>{
    const {username,imagem,email,genero,cargo,senha} = req.body
    const hash = await bcrypt.hash(senha, 12);
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
    const {email,senha} = 
  });


app.get("/feedlogado",async(req,res)=>{
  if(!req.session.user_id){
    res.redirect("/sempermissao");
    return
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
  if(!req.session.user_id){
    res.redirect("/sempermissao");
    return
  }
  const { content } = req.body
  const post = await prisma.post.create({
    data:{
      content,
      user_id:req.session.user_id
    }
  })
  console.log(post);
  res.redirect("/");
})

app.get('/perfil/:id', async (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/sempermissao");
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
      if (parseInt(req.params.id) === req.session.user_id){
        res.redirect("/meuperfil");
        return
     }
    else{
      res.render('html/perfil', { usuario,usuariologado });
      return
    }
  } catch (error) {
    console.error('Usuario nao encontrado', error);
    res.send('Usuario nao encontrado');
  }
});

app.get("/post/:id",async(req,res)=>{
  if (!req.session.user_id) {
    res.redirect("/sempermissao");
    return;
  }
  const id = req.params.id
  const post = await prisma.post.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      coments: {
        include: {
          User: true,
        },
      },
      User: true,
    },
  });
  const usuario = await prisma.user.findUnique({
    where:{
      id: post.user_id
    }
  })
  const usuariologado = await prisma.user.findUnique({
    where:{
      id:req.session.user_id
    }
  })
    res.render("html/post.ejs", {post,usuario,usuariologado});
})

app.post("/CriarComent/:id", async(req,res)=>{
  if(!req.session.user_id){
    res.redirect('/sempermissao');
    return
  }
  const { content } = req.body
  const post = await prisma.coment.create({
    data:{
      content,
      user_id:req.session.user_id,
      post_id: parseInt(req.params.id)
    }
  })
  console.log(post);
  res.redirect(`/post/${req.params.id}`);
})

app.delete('/coments/:comentId', async (req, res) => {
  if(!req.session.user_id){
    return res.redirect("/sempermissao")
  }
  const usuario = await prisma.user.findUnique({
    where:{
      id:req.session.user_id
    }});
if(!usuario.admin){
  return res.redirect("/sempermissao")
}
  const { comentId } = req.params;
  try {
    const deletedComent = await prisma.coment.delete({
      where: { id: +comentId },
    });
  res.redirect(`/post/${deletedComent.post_id}`);}
  catch (error) {
      console.error('Comentario nao encontrado', error);
      res.send('Comentario nao encontrado');
    }
  });


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
      res.redirect('/sempermissao');
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
    const usuarios = await prisma.user.findMany()
    if(!usuariologado.admin){
      res.redirect('/sempermissao');
      return
    }else{
      res.render("html/feedadmin",{usuariologado, posts, usuarios});
    }
})

app.delete('/posts/:id', async (req, res) => {
  if(!req.session.user_id){
    res.redirect('/sempermissao');
    return
  }
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

app.get("/meuperfil",async(req,res)=>{
if(!req.session.user_id){
  res.redirect('/sempermissao');
  return
}
const usuario = await prisma.user.findUnique({
  where:{
    id:req.session.user_id
  },
  include:{
    posts: true,
    coments:true
  }
})
res.render("html/PerfilUsuarioLogado",{usuario});
})

app.post("/atualizarPerfil/:id", async (req, res) => {
 
  if (req.session.user_id !== parseInt(req.params.id)) {
    res.send("Você precisa ser o usuário para editar as informações.");
    return;
  } else {
    const { email, nome, senha } = req.body;
    const updateData = {};

    if (email) {
      updateData.email = email;
    }
    if (nome) {
      updateData.username = nome;
    }
    if (senha) {
      const hash = await bcrypt.hash(senha, 12);
      updateData.senha = hash;
    }

  console.log(updateData);
    try {
      const usuario = await prisma.user.update({
        where: {
          id: +req.params.id
        },
        data: updateData
      });
      console.log(usuario);
      res.redirect("/meuperfil");
    } catch (e) {
      console.log("ERRO");
    }
  }
})


app.get("/sempermissao", (req,res)=>{
  res.render("html/sempermissao");
})

app.post("/editPost/:id", async (req, res) => {
  const { ANDRE} = req.body
  console.log(ANDRE);
  try{
    const post = await prisma.post.update({
      where:{
        id: parseInt(req.params.id)
      },
      data:{
        content:ANDRE
      }
    })
    console.log(post);
    res.redirect(`/meuperfil`);}
  catch(e){
    console.log(e);
  }
})


app.listen(3000,()=>{
    console.log("Ouvindo na porta 3000");
})