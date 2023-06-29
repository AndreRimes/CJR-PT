const PrismaClient = require("@prisma/client").PrismaClient;
const express = require("express");
const bcrypt = require("bcrypt")
const session = require("express-session");


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

app.get('/cadastro', (req, res) => {
    res.sendFile(__dirname + '/views/html/TelaDeCadastro.html');
  });

app.post("/cadastro", async(req,res)=>{
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
      res.redirect("/login")
      }catch(e){
          const erro = "username/email ja cadastrado";
          res.redirect(`/cadastro?erro=${encodeURIComponent(erro)}`);
      }
  })



app.get("/login",(req,res)=>{
    res.sendFile(__dirname + '/views/html/TelaDeLogin.html');
})


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
    const erro = "Usuario/senha incorreto";
    res.redirect(`/login?erro=${encodeURIComponent(erro)}`);
    return 
   }
   res.redirect("/feedlogado");

  } catch (e) {
    console.log("Usuario/senha incorreto");
    const erro = "Usuario/senha incorreto";
    res.redirect(`/login?erro=${encodeURIComponent(erro)}`);
    res.status(500);
  }
});


  app.get('/recuperacao', (req, res) => {
    res.sendFile(__dirname + '/views/html/TelaRecuperacaoSenha.html');
  });



app.get("/feedlogado",async(req,res)=>{
  if(!req.session.user_id){
    return res.send("VC NAO TEM PERMISSAO PARA ENTAR");
  }
  const posts = await prisma.post.findMany({
    include:{
      User:true
    }
  })
  const usuarios = await prisma.user.findMany()
  const usuariologado = await prisma.user.findUnique({
    where: {
      id: parseInt(req.session.user_id)
    }
  })
  res.render("html/feedlogado",{usuarios, usuariologado,posts});
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

    res.render('html/perfil', { usuario });
  } catch (error) {
    console.error('Usuario nao encontrado', error);
    res.send('Usuario nao encontrado');
  }
});

app.get("/NaoTemPermissao",()=>{
  res.send("VC NAO tEM PERMISSAO PARA ENTRAR NES")
})

app.use((req,res)=>{
  res.status(404).send("Pagina Nao Econtrada");

})

app.listen(3000,()=>{
    console.log("Ouvindo na porta 3000");
})