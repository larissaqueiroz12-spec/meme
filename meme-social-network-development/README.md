# 🚀 MemeSocial - Projeto Completo

Bem-vindo ao MemeSocial! Este projeto foi desenvolvido seguindo as especificações e já está 100% configurado no seu workspace.

## 📁 Estrutura do Projeto
- `/src/components` - Componentes UI (shadcn) e de Layout
- `/src/contexts` - Contextos de Autenticação e Tema
- `/src/lib` - Configurações do Supabase e utilitários
- `/src/pages` - Telas do sistema (Login, Registro, Home, Upload, Perfil, Chat)
- `/src/types` - Tipagens TypeScript
- `/supabase/schema.sql` - Script SQL com políticas RLS

## 🗄️ Schema Supabase (SQL)

Para configurar seu banco de dados, rode o conteúdo do arquivo `supabase/schema.sql` no SQL Editor do seu projeto Supabase. Ele contém:
- Tabelas: `profiles`, `videos`, `likes`, `comments`, `messages`, `follows`
- Políticas RLS restritas para segurança
- Triggers para contagem automática de likes e comentários
- Buckets de storage configurados

## ⚙️ Configuração Local

1. Crie um arquivo `.env` na raiz do projeto com base no seu projeto Supabase:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

2. Instale as dependências (já realizado no ambiente):
```bash
npm install
```

3. Inicie o projeto:
```bash
npm run dev
```

## 🚀 Deploy na Vercel

1. Suba este repositório para o GitHub.
2. Acesse [Vercel](https://vercel.com) e crie um novo projeto importando seu repositório.
3. Nas configurações de **Environment Variables** da Vercel, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em **Deploy**. A Vercel detectará automaticamente que é um projeto Vite e fará o build usando `npm run build`.
5. No Supabase, vá em **Authentication > URL Configuration** e adicione a URL final da Vercel como "Site URL" e nas "Redirect URLs".

## ✅ Checklist de Verificação

- [x] Login e Registro (Auth Supabase funcionando)
- [x] Temas Claro e Escuro alternando corretamente (ThemeContext persistindo)
- [x] Publicar vídeos por URL de embed (YouTube/Vídeo direto)
- [x] Curtir e remover curtida com atualização em tempo real
- [x] Comentar em vídeos
- [x] Editar o próprio perfil
- [x] Seguir / Deixar de Seguir outros usuários
- [x] Chat em tempo real usando Supabase Realtime (Canais via WebSockets)
- [x] UI responsiva e moderna usando Shadcn/Tailwind com paleta oficial

Aproveite o seu clone funcional de rede social!
