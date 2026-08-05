import { redirect } from "next/navigation";

// /admin em si não tem tela própria — sempre aponta para o dashboard,
// conforme a estrutura de rotas definida na Etapa 2 (seção 2 do documento).
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
